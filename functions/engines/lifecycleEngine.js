function calculateLifecycle({

  ageHours,
  velocity,
  momentum,
  rankChange

}) {

  // EARLY EXPLOSION
  if (
    ageHours < 12 &&
    velocity > 50000 &&
    momentum > 70
  ) {

    return "breakout";

  }

  // PEAK PHASE
  if (
    velocity > 30000 &&
    rankChange >= 0 &&
    momentum > 40
  ) {

    return "peaking";

  }

  // DECLINING
  if (
    rankChange < -5 &&
    momentum < 0
  ) {

    return "declining";

  }

  // DEAD TREND
  if (
    velocity < 5000 &&
    ageHours > 72
  ) {

    return "dead";

  }

  // COMEBACK
  if (
    rankChange > 10 &&
    ageHours > 48
  ) {

    return "comeback";

  }

  // LONGTERM STABLE HIT
  if (
    ageHours > 168 &&
    velocity > 10000
  ) {

    return "longterm_hit";

  }

  return "stable";

}

module.exports = {

  calculateLifecycle

};
