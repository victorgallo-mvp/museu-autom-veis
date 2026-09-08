function round2(value) {
  return Math.round(value * 100) / 100;
}

function calcTotals(quantity, unitPrice, commissionPerUnit) {
  const total = round2(quantity * unitPrice);
  const commissionTotal = round2(quantity * commissionPerUnit);
  const ownerShareTotal = round2(total - commissionTotal);

  return { total, commissionTotal, ownerShareTotal };
}

function halfPriceOf(ticketPrice) {
  return round2(ticketPrice / 2);
}

// Regra de ingressos: adultos pagam inteira, crianças de 7 a 12 pagam meia
// (sempre metade do valor cheio) e crianças até 6 anos não pagam.
// A comissão do guia segue a mesma proporção: inteira por adulto, metade por
// criança de meia entrada e nada por criança até 6 anos.
function calcVisitTotals({ adults, childrenHalf, childrenFree }, ticketPrice, commissionPerPerson) {
  const halfPrice = halfPriceOf(ticketPrice);
  const halfCommission = halfPriceOf(commissionPerPerson);
  const payingCount = adults + childrenHalf;
  const total = round2(adults * ticketPrice + childrenHalf * halfPrice);
  const commissionTotal = round2(adults * commissionPerPerson + childrenHalf * halfCommission);
  const ownerShareTotal = round2(total - commissionTotal);

  return {
    total,
    commissionTotal,
    ownerShareTotal,
    halfPrice,
    payingCount,
    peopleCount: adults + childrenHalf + childrenFree,
  };
}

module.exports = { round2, calcTotals, halfPriceOf, calcVisitTotals };
