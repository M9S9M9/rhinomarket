export function calculateCommission(
  amount: number,
  commissionPercent: number = 15
): { commission: number; designerEarning: number } {
  const commission = (amount * commissionPercent) / 100;
  const designerEarning = amount - commission;
  return {
    commission: Math.round(commission * 100) / 100,
    designerEarning: Math.round(designerEarning * 100) / 100,
  };
}
