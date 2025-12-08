import DodoPayments from 'dodopayments';

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY || '',
  environment: (process.env.DODO_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode',
});

export type { DodoPayments };