function calculateMomentum({

  velocity,
  rankChange,
  ageHours

}) {

  let momentum = 0;

  // VELOCITY POWER

  momentum += Math.min(
    velocity / 1000,
    50
  );

  // RANK MOVEMENT

  momentum += rankChange * 8;

  // FRESHNESS BONUS

  if (ageHours <= 24) {

    momentum += 20;

  }

  else if (ageHours <= 72) {

    momentum += 10;

  }

  // FLOOR

  momentum = Math.max(
    Math.floor(momentum),
    0
  );

  return momentum;

}

module.exports = {
  calculateMomentum
};
