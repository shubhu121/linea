// Subscription types
export interface DodoSubscription {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Customer types
export interface DodoCustomer {
  customer_id: string;
  email: string;
  created_at: string;
  metadata?: Record<string, any>;
  default_payment_method?: string;
}

// Payment types
export interface DodoPayment {
  payment_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  created_at: string;
  metadata?: Record<string, any>;
}

// Webhook event types
export type DodoWebhookEvent = 
  | { type: 'subscription.created'; data: { subscription_id: string; customer_id: string; product_id: string; status: string; plan_id: string } }
  | { type: 'subscription.updated'; data: { subscription_id: string; status: string; plan_id?: string } }
  | { type: 'subscription.canceled'; data: { subscription_id: string; customer_id: string } }
  | { type: 'subscription.payment_failed'; data: { subscription_id: string; customer_id: string; reason: string } }
  | { type: 'payment.completed'; data: { payment_id: string; customer_id: string; amount: number; currency: string } };

// Webhook payload types
export interface DodoWebhookPayload<T = any> {
  event_id: string;
  event_type: string;
  timestamp: string;
  data: T;
}

// Checkout session types
export interface DodoCheckoutSession {
  checkout_session_id: string;
  checkout_url: string;
  success_url: string;
  cancel_url: string;
  line_items: Array<{
    product_id: string;
    quantity: number;
  }>;
  customer_id?: string;
  created_at: string;
}

// Plan configuration
export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  traceLimit: number;
  features: string[];
  dodoProductId: string;
  popular?: boolean;
}
