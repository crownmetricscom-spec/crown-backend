function calculatePrediction({

  velocity,
  momentum,
  lifecycle,
  suspiciousScore,
  ageHours

}) {

  let predictionScore = 0;

  // Velocity
  predictionScore += Math.min(
    velocity / 1000,
    40
  );

  // Momentum
  predictionScore += Math.min(
    momentum,
    30
  );

  // Lifecycle Bonus
  if (lifecycle === "breakout") {
    predictionScore += 25;
  }

  if (lifecycle === "peaking") {
    predictionScore += 15;
  }

  // Anti Fake
  predictionScore -= suspiciousScore * 0.5;

  // Fresh Upload Bonus
  if (ageHours < 12) {
    predictionScore += 10;
  }

  // Clamp
  predictionScore = Math.max(
    0,
    Math.min(
      Math.floor(predictionScore),
      100
    )
  );

  let predictionLabel = "stable";

  if (predictionScore >= 80) {
    predictionLabel = "future_global_hit";
  }

  else if (predictionScore >= 60) {
    predictionLabel = "viral_candidate";
  }

  else if (predictionScore >= 40) {
    predictionLabel = "watchlist";
  }

  return {

    predictionScore,
    predictionLabel

  };

}

module.exports = {

  calculatePrediction

};
