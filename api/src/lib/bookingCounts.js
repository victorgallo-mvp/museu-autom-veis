// Quebra de pessoas de um agendamento por faixa etária.
// Quando há contagem real (visita paga / não compareceu) usamos a real; caso
// contrário a prevista. Adultos são derivados: total - meia - grátis.
function breakdown(total, childrenHalf, childrenFree) {
  const free = Math.min(childrenFree, total);
  const half = Math.min(childrenHalf, total - free);
  return {
    total,
    adults: total - half - free,
    childrenHalf: half,
    childrenFree: free,
  };
}

function expectedCounts(booking) {
  return breakdown(
    booking.expectedPeopleCount,
    booking.expectedChildrenHalf ?? 0,
    booking.expectedChildrenFree ?? 0
  );
}

function actualCounts(booking) {
  if (booking.actualPeopleCount === null || booking.actualPeopleCount === undefined) {
    return null;
  }
  return breakdown(
    booking.actualPeopleCount,
    booking.actualChildrenHalf ?? 0,
    booking.actualChildrenFree ?? 0
  );
}

function effectiveCounts(booking) {
  return actualCounts(booking) ?? expectedCounts(booking);
}

module.exports = { breakdown, expectedCounts, actualCounts, effectiveCounts };
