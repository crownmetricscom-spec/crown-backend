function detectSuspiciousActivity({

views,
likes,
comments,
velocity,
subscriberCount,
ageHours

}) {

let suspiciousScore = 0;



// ===============================
// LIKE RATIO
// ===============================

const likeRatio =
likes / Math.max(views, 1);

if (likeRatio > 0.25) {

suspiciousScore += 25;

}



// ===============================
// COMMENT RATIO
// ===============================

const commentRatio =
comments / Math.max(views, 1);

if (commentRatio > 0.08) {

suspiciousScore += 20;

}



// ===============================
// VELOCITY TOO HIGH
// ===============================

if (
velocity > 250000 &&
subscriberCount < 50000
) {

suspiciousScore += 30;

}



// ===============================
// TOO FAST FOR NEW VIDEO
// ===============================

if (
ageHours < 2 &&
views > 1000000
) {

suspiciousScore += 20;

}



// ===============================
// FINAL LABEL
// ===============================

let suspiciousLabel = "clean";

if (suspiciousScore >= 70) {

suspiciousLabel = "high_risk";

}

else if (suspiciousScore >= 40) {

suspiciousLabel = "medium_risk";

}

else if (suspiciousScore >= 20) {

suspiciousLabel = "low_risk";

}

return {

suspiciousScore,
suspiciousLabel

};

}

module.exports = {

detectSuspiciousActivity

};
