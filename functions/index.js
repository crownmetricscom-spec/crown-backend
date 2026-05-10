console.log("BOOT SUCCESS");

const express = require("express");

const app = express();

app.get("/api/test", (req, res) => {
  res.json({
    status: "working"
  });
});

app.get("/api/youtube", async (req, res) => {

  try {

    const apiKey = process.env.YOUTUBE_API_KEY;

    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=drake&type=video&maxResults=10&key=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

    const analyzed = data.items.map((video, index) => {

      const title = video.snippet.title;

      let score = 50;

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

        title: title,

        channel: video.snippet.channelTitle,

        published: video.snippet.publishedAt,

        thumbnail: video.snippet.thumbnails.high.url,

        viralScore: score

      };

    });

    res.json({
      keyword: "drake",
      totalVideos: analyzed.length,
      results: analyzed
    });

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