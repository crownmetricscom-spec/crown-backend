console.log("BOOT SUCCESS");

const express = require("express");

const fs = require("fs");
const path = require("path");

const app = express();

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
	
	let oldSnapshot = [];

	try {

	  const oldData = fs.readFileSync(
		path.join(__dirname, "snapshots", "snapshot.json")
	  );

	  oldSnapshot = JSON.parse(oldData).results || [];

	} catch (e) {

	  oldSnapshot = [];

	}

    const analyzed = data.items.map((video, index) => {

      const title = video.snippet.title;
	  
	  const oldVideo =
	  oldSnapshot.find(v => v.id === video.id);

	const previousRank =
	  oldVideo ? oldVideo.rank : null;

	const rankChange =
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
	  previousRank
		? previousRank - (index + 1)
    : 0;

      const views =
	  parseInt(video.statistics.viewCount || 0);

	const likes =
	  parseInt(video.statistics.likeCount || 0);

	const comments =
	  parseInt(video.statistics.commentCount || 0);
	  
	const publishedDate =
	  new Date(video.snippet.publishedAt);

	const now = new Date();

	const ageHours =
	  (now - publishedDate) / 3600000;
	
	const velocity =
		views / Math.max(ageHours, 1);

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



      if (title.toLowerCase().includes("drake")) {
        score += 20;
      }

      if (title.toLowerCase().includes("diss")) {
        score += 15;
      }

      if (title.toLowerCase().includes("kendrick")) {
        score += 25;
      }

      if (title.toLowerCase().includes("reaction")) {
        score += 10;
      }

      return {

	  rank: index + 1,

	  id: video.id,

	  title: title,

	  channel: video.snippet.channelTitle,

	  published: video.snippet.publishedAt,

	  thumbnail: video.snippet.thumbnails.high.url,

	  views: parseInt(video.statistics.viewCount || 0),

	  likes: parseInt(video.statistics.likeCount || 0),

	  comments: parseInt(video.statistics.commentCount || 0),

	  viralScore: score,
		velocity: Math.floor(velocity),

		previousRank,

		rankChange
		status

	};

    });

    const snapshot = {
      keyword: "drake",
      totalVideos: analyzed.length,
      updated: new Date(),
      results: analyzed
    };

    const filePath = path.join(
      __dirname,
      "snapshots",
      "snapshot.json"
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(snapshot, null, 2)
    );

    res.json(snapshot);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

app.get("/api/snapshot", (req, res) => {

  try {

    const filePath = path.join(
      __dirname,
      "snapshots",
      "snapshot.json"
    );

    const data = fs.readFileSync(filePath);

    const json = JSON.parse(data);

    res.json(json);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});