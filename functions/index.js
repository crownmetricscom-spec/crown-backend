const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("HOME OK");
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "working"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("BOOT SUCCESS");
  console.log("Server running on port " + PORT);
});