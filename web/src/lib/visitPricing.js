import { round2 } from './format';

// Espelho da regra do backend: adultos pagam inteira, crianças de 7 a 12 pagam
// meia (metade do valor cheio) e crianças até 6 anos não pagam. A comissão do
// guia segue a mesma proporção: inteira por adulto, metade por meia entrada.
export function halfPriceOf(ticketPrice) {
  return round2(Number(ticketPrice) / 2);
}

export function calcVisitTotals({ adults, childrenHalf, childrenFree }, ticketPrice, commission) {
  const price = Number(ticketPrice) || 0;
  const halfPrice = halfPriceOf(price);
  const commissionValue = Number(commission) || 0;
  const halfCommission = halfPriceOf(commissionValue);
  const payingCount = adults + childrenHalf;
  const total = round2(adults * price + childrenHalf * halfPrice);
  const guideCommissionTotal = round2(adults * commissionValue + childrenHalf * halfCommission);
  const ownerShareTotal = round2(total - guideCommissionTotal);

  return {
    total,
    guideCommissionTotal,
    ownerShareTotal,
    halfPrice,
    payingCount,
    peopleCount: adults + childrenHalf + childrenFree,
  };
}

export function formatBreakdown({ adults, childrenHalf, childrenFree }) {
  const parts = [`${adults} adulto${adults === 1 ? '' : 's'}`];
  if (childrenHalf > 0) parts.push(`${childrenHalf} meia`);
  if (childrenFree > 0) parts.push(`${childrenFree} grátis`);
  return parts.join(' · ');
}
