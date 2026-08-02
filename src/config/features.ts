/**
 * Feature flag system for compliance-driven features.
 * All real-money-adjacent experience is disabled by default.
 */
export const ENABLE_REAL_MONEY_FEATURES = false;

export const realMoneyFeatures = {
  showStakeAmountStep: false,
  showStakeReview: false,
  showWalletBalance: false,
  showDepositWithdraw: false,
  showEscrow: false,
  showTransactionHistory: false,
  makeStakeRequired: false,
} as const;

export const virtualCurrencyFeatures = {
  showVirtualCurrency: true,
} as const;
