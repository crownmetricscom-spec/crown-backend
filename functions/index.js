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
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=drake&type=video&maxResults=5&key=${apiKey}`;

    const response = await fetch(url);

    const data = await response.json();

    res.json(data);

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