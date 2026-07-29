function round2(value) {
  return Math.round(value * 100) / 100;
}

function calcBookingTotals(peopleCount, ticketPriceSnapshot, guideCommissionSnapshot) {
  const total = round2(peopleCount * ticketPriceSnapshot);
  const guideCommissionTotal = round2(peopleCount * guideCommissionSnapshot);
  const ownerShareTotal = round2(total - guideCommissionTotal);

  return { total, guideCommissionTotal, ownerShareTotal };
}

module.exports = { round2, calcBookingTotals };
