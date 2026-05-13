console.log("BOOT SUCCESS");

const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

serviceAccount.private_key =
serviceAccount.private_key.replace(
  /\\n/g,
  "\n"
);



admin.initializeApp({
  credential:
  admin.credential.cert(serviceAccount),

  databaseURL:
  "https://crown-metrics-default-rtdb.europe-west1.firebasedatabase.app"
});

const db = admin.database();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const {
  calculateScore,
  calculateStatus
} = require("./engines/scoreEngine");

const {
  detectSuspiciousActivity
} = require("./engines/aiDetectionEngine");

const {
  detectDuplicateVideos
} = require("./engines/duplicateDetectionEngine");

const {
  getLabel,
  getIcon
} = require("./engines/labelEngine");

const {
  calculateVelocity
} = require("./engines/velocityEngine");

const app = express();

const API_KEYS = [

process.env.YOUTUBE_API_KEY_1,
process.env.YOUTUBE_API_KEY_2,
process.env.YOUTUBE_API_KEY_3,
process.env.YOUTUBE_API_KEY_4,
process.env.YOUTUBE_API_KEY_5,
process.env.YOUTUBE_API_KEY_6

];

function getApiKey() {

return API_KEYS[currentKeyIndex];

}

function rotateApiKey() {

currentKeyIndex++;

if (currentKeyIndex >= API_KEYS.length) {

currentKeyIndex = 0;

}

console.log(
"SWITCHED TO API KEY:",
currentKeyIndex + 1
);

}

let currentKeyIndex = 0;



let COUNTRIES = [

"AE","AR","AT","AU","AZ",
"BA","BD","BE","BG","BH","BO","BR","BY",
"CA","CH","CL","CO","CR","CY","CZ",
"DE","DK","DO","DZ",
"EC","EE","EG","ES",
"FI","FR","GB","GE","GH","GR","GT",
"HK","HN","HR","HU",
"ID","IE","IL","IN","IQ","IS","IT",
"JM","JO","JP",
"KE","KR","KW","KZ",
"LB","LI","LK","LT","LU","LV",
"LY","MA","ME","MK","MT","MX","MY",
"NG","NI","NL","NO","NP","NZ",
"OM","PA","PE","PH","PK","PL","PR","PT","PY",
"QA","RO","RS","RU",
"SA","SE","SG","SI","SK","SN","SV",
"TH","TN","TR","TW","TZ",
"UA","UG","US","UY","UZ",
"VE","VN","YE","ZA","ZW"

];

async function discoverNewRegions() {

  console.log("REGION DISCOVERY START");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const a of alphabet) {

    for (const b of alphabet) {

      const code = a + b;

      if (COUNTRIES.includes(code)) {
        continue;
      }

      try {

        const apiKey = getApiKey();

	const url =
`https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&regionCode=${code}&key=${apiKey}`;

        const response =
          await fetch(url);

        const data =
          await response.json();

        if (
          data.items &&
          data.items.length > 0
        ) {

          COUNTRIES.push(code);

          console.log(
            "NEW REGION FOUND:",
            code
          );

          await db.ref(
            "system/new_regions/" + code
          ).set({

            discovered:
              Date.now(),

            code

          });

        }
}

      catch (err) {

        console.log(
          "DISCOVERY ERROR:",
          code
        );

      }

    }

  }

  console.log("REGION DISCOVERY END");

}
		  






app.use(cors());

app.get("/api/test", (req, res) => {

  res.json({
    status: "working"
  });

});

app.get("/api/trending/:region", async (req, res) => {

  try {

    const apiKey = getApiKey();

    const region = req.params.region || "US";
	  if(region === "GLOBAL") {

		return res.json({
		results: []
		});
		
		}

    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=30&regionCode=${region}&key=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

	  if (data.error) {

console.log(
"API ERROR:",
data.error.message
);

if (
data.error.message.toLowerCase().includes("quota")
) {

rotateApiKey();

}

}

    // ===============================
    // LOAD OLD SNAPSHOT
    // ===============================

    let oldSnapshot = [];

    try {

      const snapshotFile =
  `snapshot-${region}.json`;

	const oldData = fs.readFileSync(
  	path.join(
    __dirname,
    "snapshots",
    snapshotFile
  	)
	);

      oldSnapshot =
        JSON.parse(oldData).results || [];

    } catch (e) {

      oldSnapshot = [];

    }

    // ===============================
    // ANALYSIS ENGINE
    // ===============================

    const analyzed = [];
	const rawVideos = [];  

const channelIds = data.items
.map(v => v.snippet.channelId)
.join(",");

const channelResponse = await fetch(

`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${apiKey}`

);

const channelData =
await channelResponse.json();

const channelMap = {};

channelData.items.forEach(c => {

channelMap[c.id] = {

subs:
parseInt(c.statistics.subscriberCount || 0),

videos:
parseInt(c.statistics.videoCount || 0),

country:
c.snippet?.country || "GLOBAL"

};

});
	  
	for (const [index, video] of data.items.entries()) {

	const channelInfo =
	channelMap[video.snippet.channelId] || {};
		
      const title =
        video.snippet.title;

      const oldVideo =
        oldSnapshot.find(
          v => v.id === video.id
        );

      const previousRank =
        oldVideo
          ? oldVideo.rank
          : null;

      const rankChange =
        previousRank
          ? previousRank - (index + 1)
          : 0;

      // ===============================
      // STATS
      // ===============================

      const views =
        parseInt(
          video.statistics.viewCount || 0
        );

      const likes =
        parseInt(
          video.statistics.likeCount || 0
        );

      const comments =
        parseInt(
          video.statistics.commentCount || 0
        );

      // ===============================
      // TIME ENGINE
      // ===============================

      const publishedDate =
        new Date(
          video.snippet.publishedAt
        );

      const now = new Date();

      const ageHours =
        (now - publishedDate) / 3600000;

      // ===============================
      // VELOCITY ENGINE
      // ===============================

      const velocity = calculateVelocity({

		  views,
		  ageHours
		
		});

      // ===============================
      // SCORE ENGINE
      // ===============================

		let score = calculateScore({
		
		views,
		likes,
		comments,
		ageHours,
		rankChange,
		title
		
		});


      // ===============================
      // BONUS SIGNALS
      // ===============================

      if (
        title.toLowerCase().includes("drake")
      ) {

        score += 20;

      }

      if (
        title.toLowerCase().includes("diss")
      ) {

        score += 15;

      }

      if (
        title.toLowerCase().includes("kendrick")
      ) {

        score += 25;

      }

      if (
  title.toLowerCase().includes("reaction")
) {

  score += 10;

}

const status = calculateStatus({

  score,
  velocity,
  rankChange,
  rank: index + 1

});

const aiDetection = detectSuspiciousActivity({

  views,
  likes,
  comments,
  velocity,
  subscriberCount:
  channelInfo.subs || 0,
  ageHours

});

		rawVideos.push({

		id: video.id,
		title: video.snippet.title
		
		});


	  
      // ===============================
      // RETURN OBJECT
      // ===============================

      analyzed.push({

  		firstListed:
    		oldVideo?.firstListed || Date.now(),

  		lastSeen:
    		Date.now(),

        rank: index + 1,

        id: video.id,

        title:
    	video.snippet.title,

        channel:
  		video.snippet.channelTitle,

		originCountry:
		channelInfo.country || "GLOBAL",

		published:
  		video.snippet.publishedAt,
			

        thumbnail:
          video.snippet.thumbnails.high.url,

        views,

        likes,

        comments,

        score: score,

		viralScore: score,
		
		viralProbability: Math.min(
		  Math.floor(
		    (score * 0.7) +
		    (Math.min(velocity, 50000) / 1000)
		  ),
		  99
		),
		
		velocity:
		Math.floor(velocity),
		
		previousRank,
		
		rankChange,
		
		status,
		
		label:
		getLabel(status),
		
		icon:
		getIcon(status),

		  
		ageInHours:
  			Math.floor(ageHours),
		
		subscriberCount:
		channelInfo.subs || 0,
		
		videoCount:
		channelInfo.videos || 0,

				
		suspiciousScore:
		aiDetection.suspiciousScore,
		
		suspiciousLabel:
		aiDetection.suspiciousLabel

		  
		});
		
		}


		const duplicateIds =
		detectDuplicateVideos(rawVideos);
	  
    // ===============================
    // SNAPSHOT
    // ===============================

    const snapshot = {

      totalVideos:
        analyzed.length,

      updated:
        new Date(),

      region,

      results:
        analyzed,
	
		duplicateVideos:
		duplicateIds

    };

    // ===============================
    // SAVE SNAPSHOT
    // ===============================

    const snapshotFile =
  	`snapshot-${region}.json`;

	const filePath = path.join(
  	__dirname,
  	"snapshots",
  	snapshotFile
	);

    fs.writeFileSync(
      filePath,
      JSON.stringify(snapshot, null, 2)
    );
	
	// FIREBASE LIVE SAVE

		const updates = {};
		
		updates[
		  `snapshots_live/${region}/metadata/lastUpdate`
		] = Date.now();
		
		analyzed.forEach((song, index) => {
		
		  // SONG GLOBAL SPEICHERN
		  updates[
		    `songs_by_id/${song.id}`
		  ] = song;
		
		  // RANKING SPEICHERN
		  updates[
		    `snapshots_live/${region}/rankings/${index + 1}`
		  ] = song.id;
		
		});
		
		await db.ref().update(updates);

	// FIREBASE HISTORY SAVE

	await db.ref(
	  "snapshots_history/" +
	  region +
	  "/" +
	  Date.now()
	).set({

	  songs: analyzed

	});
	
	
	
	
	const historyFileName =
  `${region}-${Date.now()}.json`;



	const historyPath = path.join(

	  __dirname,
	  "snapshots",
	  "history",
	  historyFileName

	);

	fs.writeFileSync(

	  historyPath,
	  JSON.stringify(snapshot, null, 2)

	);

    // ===============================
    // RESPONSE
    // ===============================

    res.json(snapshot);

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

});

// ===============================
// SNAPSHOT ROUTE
// ===============================

app.get("/api/snapshot", (req, res) => {

  try {

    const region =
      req.query.region || "US";

    const filePath = path.join(
      __dirname,
      "snapshots",
      `snapshot-${region}.json`
    );

    const data =
      fs.readFileSync(filePath);

    const json =
      JSON.parse(data);

    res.json(json);

  }

  catch (error) {

    res.status(500).json({

      error: error.message

    });

  }

});

// ===============================
// SERVER
// ===============================


async function autoGlobalScanner() {

  console.log("AUTO SCAN START");

  for (const region of COUNTRIES) {

    try {

		const apiKey = getApiKey();

      console.log("Scanning:", region);

      

      const url =
`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=30&regionCode=${region}&key=${apiKey}`;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (!data.items) {

        console.log(
          "No data:",
          region
        );

        continue;

      }

      // ===============================
      // ANALYSIS ENGINE
      // ===============================

      const analyzed = [];

const channelIds = data.items
.map(v => v.snippet.channelId)
.join(",");

const channelResponse = await fetch(

`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${apiKey}`

);

const channelData =
await channelResponse.json();

const channelMap = {};

channelData.items.forEach(c => {

channelMap[c.id] = {

subs:
parseInt(c.statistics.subscriberCount || 0),

videos:
parseInt(c.statistics.videoCount || 0),

country:
c.snippet?.country || "GLOBAL"

};

});

		
      for (const [index, video] of data.items.entries()) {

        const channelInfo =
		channelMap[video.snippet.channelId] || {};

        const views =
          parseInt(
            video.statistics.viewCount || 0
          );

        const likes =
          parseInt(
            video.statistics.likeCount || 0
          );

        const comments =
          parseInt(
            video.statistics.commentCount || 0
          );

        const publishedDate =
          new Date(
            video.snippet.publishedAt
          );

        const ageHours =
          (
            Date.now() - publishedDate
          ) / 3600000;

        const velocity = calculateVelocity({

		  views,
		  ageHours
		
		});

		 let score = calculateScore({
		
		views,
		likes,
		comments,
		ageHours
		
		});
		
		const status = calculateStatus({
		
		score,
		velocity,
		rankChange: 0,
		rank: index + 1
		
		});


        

        analyzed.push({

          firstListed:
            Date.now(),

          lastSeen:
            Date.now(),

          rank:
            index + 1,

          id:
            video.id,

          title:
            video.snippet.title,

          channel:
  			video.snippet.channelTitle,

			originCountry:
			channelInfo.country || "GLOBAL",
			
			published:
			  video.snippet.publishedAt,

          thumbnail:
            video.snippet.thumbnails.high.url,

          views,

          likes,

          comments,

          viralScore:
            score,

          velocity:
            Math.floor(velocity),

          previousRank:
            null,

          rankChange:
            0,

          status,

          ageInHours:
            Math.floor(ageHours),

          subscriberCount:
			channelInfo.subs || 0,

          videoCount:
			channelInfo.videos || 0

        });

      }

      // ===============================
      // FIREBASE LIVE SAVE
      // ===============================

      await db.ref(
        "snapshots_live/" + region
      ).set({

        lastUpdate:
          Date.now(),

        songs:
          analyzed

      });

      // ===============================
      // FIREBASE HISTORY SAVE
      // ===============================

      await db.ref(

        "snapshots_history/" +
        region +
        "/" +
        Date.now()

      ).set({

        songs:
          analyzed

      });

      console.log(
        "Saved:",
        region
      );

    }

    catch (err) {

      console.log(

        "SCAN ERROR:",
        region,
        err.message

      );

    }

  }

  console.log("AUTO SCAN END");

}


const PORT =
  process.env.PORT || 8080;
setTimeout(() => {

  autoGlobalScanner();

}, 15000);

setInterval(() => {

  autoGlobalScanner();

}, 1800000);
app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
