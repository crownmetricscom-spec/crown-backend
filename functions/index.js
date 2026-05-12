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

const app = express();

app.use(cors());

app.get("/api/test", (req, res) => {

  res.json({
    status: "working"
  });

});

app.get("/api/trending/:region", async (req, res) => {

  try {

    const apiKey = process.env.YOUTUBE_API_KEY;

    const region = req.params.region || "US";

    const url =
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&maxResults=30&regionCode=${region}&key=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

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

	for (const [index, video] of data.items.entries()) {

		const channelResponse = await fetch(
  		`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${video.snippet.channelId}&key=${apiKey}`
		);

const channelData =
  await channelResponse.json();

const channelStats =
  channelData.items?.[0]?.statistics || {};

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

      const velocity =
        views / Math.max(ageHours, 1);

      // ===============================
      // SCORE ENGINE
      // ===============================

      let score = Math.floor(

        (

          (
            likes +
            (comments * 2)
          )

          /

          (views || 1)

        )

        *

        10000

        *

        (

          ageHours < 24
            ? 1.5
            : ageHours < 72
            ? 1.2
            : 1

        )

      );

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

      // ===============================
      // TREND STATUS ENGINE
      // ===============================

      let status = "stable";

      if (
        score >= 900 &&
        velocity >= 30000 &&
        rankChange >= 2
      ) {

        status = "viral";

      }

      else if (
        score >= 700 &&
        velocity >= 15000
      ) {

        status = "hot";

      }

      else if (
        rankChange >= 3
      ) {

        status = "rising";

      }

      else if (
        rankChange <= -3
      ) {

        status = "falling";

      }

      else if (
        velocity >= 40000 &&
        index >= 15
      ) {

        status = "hidden_gem";

      }

      else if (
        index === 0 &&
        score >= 800
      ) {

        status = "champion";

      }

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

        title: title,

        channel:
          video.snippet.channelTitle,

        published:
          video.snippet.publishedAt,

        thumbnail:
          video.snippet.thumbnails.high.url,

        views,

        likes,

        comments,

        viralScore: score,

        velocity:
          Math.floor(velocity),

        previousRank,

        rankChange,

		status,

		ageInHours:
  			Math.floor(ageHours),
		
		subscriberCount:
		  parseInt(
		    channelStats.subscriberCount || 0
		  ),
		
		videoCount:
		  parseInt(
		    channelStats.videoCount || 0
		  )
		
		});
		
		}



	  
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
        analyzed

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

	await db.ref("snapshots_live/" + region).set({

	  lastUpdate: Date.now(),

	  songs: analyzed

	});

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

const PORT =
  process.env.PORT || 8080;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
