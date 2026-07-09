/**
 * Feature flag system for compliance-driven features
 * Controls visibility of real-money-adjacent features
 */

/**
 * ENABLE_REAL_MONEY_FEATURES controls:
 * - Stake amount field in Create Pact (Step 2)
 * - Stake review in Create Pact (Step 5)
 * - Wallet balance displays
 * - Deposit/Withdraw actions
 * - Escrow functionality
 * 
 * Default: false (disabled for compliance)
 * Will be wired to geolocation/jurisdiction detection in future updates
 */
export const ENABLE_REAL_MONEY_FEATURES =
  process.env.NEXT_PUBLIC_ENABLE_REAL_MONEY_FEATURES === 'true';

/**
 * Features controlled by ENABLE_REAL_MONEY_FEATURES
 */
export const realMoneyFeatures = {
  // Create Pact flow
  showStakeAmountStep: ENABLE_REAL_MONEY_FEATURES,
  showStakeReview: ENABLE_REAL_MONEY_FEATURES,
  
  // Wallet features
  showWalletBalance: ENABLE_REAL_MONEY_FEATURES,
  showDepositWithdraw: ENABLE_REAL_MONEY_FEATURES,
  showEscrow: ENABLE_REAL_MONEY_FEATURES,
  showTransactionHistory: ENABLE_REAL_MONEY_FEATURES,
  
  // Form validation
  makeStakeRequired: ENABLE_REAL_MONEY_FEATURES,
} as const;

/**
 * Virtual currency features (NOT gated by real money flag)
 * These are always available regardless of real money status
 */
export const virtualCurrencyFeatures = {
  // Virtual points/credits are always available
  showVirtualCurrency: true,
} as const;
