function round2(value) {
  return Math.round(value * 100) / 100;
}

function calcTotals(quantity, unitPrice, commissionPerUnit) {
  const total = round2(quantity * unitPrice);
  const commissionTotal = round2(quantity * commissionPerUnit);
  const ownerShareTotal = round2(total - commissionTotal);

  return { total, commissionTotal, ownerShareTotal };
}

module.exports = { round2, calcTotals };
