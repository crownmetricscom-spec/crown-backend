function calculateVelocity({
  views,
  ageHours
}) {

  return Math.floor(
    views / Math.max(ageHours, 1)
  );

}

module.exports = {
  calculateVelocity
};
