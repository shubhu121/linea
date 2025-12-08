import { PlanConfig } from '@/types/dodo';

export const PLAN_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 500,
} as const;

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    interval: 'month',
    traceLimit: 5,
    dodoProductId: '', // Free plan doesn't need Dodo product
    features: [
      '5 concept traces per month',
      'Basic provenance analysis',
      'Interactive timeline view',
      'Force-directed graph explorer',
      'Export to PDF',
    ],
  },
  {
    id: 'pro',
    name: 'Researcher',
    price: 29,
    interval: 'month',
    traceLimit: 50,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_PRO_PRODUCT_ID || '',
    popular: true,
    features: [
      '50 concept traces per month',
      'Advanced provenance analysis',
      'Priority AI processing',
      'Detailed mutation insights',
      'Export to multiple formats',
      'Citation network analysis',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Institution',
    price: 99,
    interval: 'month',
    traceLimit: 500,
    dodoProductId: process.env.NEXT_PUBLIC_DODO_ENTERPRISE_PRODUCT_ID || '',
    features: [
      '500 concept traces per month',
      'Full provenance research suite',
      'Custom AI model fine-tuning',
      'Collaborative team features',
      'API access',
      'Advanced analytics dashboard',
      'Dedicated account manager',
      'Custom integration support',
    ],
  },
];

export function getPlanById(planId: string): PlanConfig | undefined {
  return PLANS.find(plan => plan.id === planId);
}

export function getPlanByDodoProductId(productId: string): PlanConfig | undefined {
  return PLANS.find(plan => plan.dodoProductId === productId);
}
