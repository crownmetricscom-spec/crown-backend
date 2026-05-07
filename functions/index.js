const functions = require("firebase-functions");

exports.testFunction = functions.https.onRequest((req, res) => {
    res.json({
        success: true,
        message: "Crown Metrics Backend läuft 🔥"
    });
});
