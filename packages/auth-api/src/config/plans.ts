export interface PlanDef {
  name: string;
  priceCents: number; // ZAR cents, 0 = free
  frequency: 'monthly' | 'yearly';
  features: string[];
}

export type ProductId = 'beegraded' | 'pollenz' | 'swarmz' | 'broodz';

export const PLANS: Record<ProductId, Record<string, PlanDef>> = {
  beegraded: {
    free: {
      name: 'Free',
      priceCents: 0,
      frequency: 'monthly',
      features: ['1 paper', 'Basic rubric only', 'Standard AI evaluation'],
    },
    pro: {
      name: 'Pro',
      priceCents: 14900, // R149/month
      frequency: 'monthly',
      features: ['Unlimited papers', 'Custom rubric upload', 'Comparison reports', 'Study guides', 'Priority AI processing'],
    },
  },
  pollenz: {
    free: {
      name: 'Free',
      priceCents: 0,
      frequency: 'monthly',
      features: ['10 invoices', '10 expenses', '10 statement uploads', 'No API integration'],
    },
    pro: {
      name: 'Pro',
      priceCents: 9900, // R99/month
      frequency: 'monthly',
      features: ['Unlimited invoices & expenses', 'API integrations', 'Tax reports', 'Recurring invoices', 'PDF export'],
    },
  },
  swarmz: {
    free: {
      name: 'Free',
      priceCents: 0,
      frequency: 'monthly',
      features: ['2 vehicles', 'Expense logging only', 'No tracking or logbook'],
    },
    pro: {
      name: 'Pro',
      priceCents: 14900, // R149/month
      frequency: 'monthly',
      features: ['Unlimited vehicles', 'Vehicle tracking', 'SARS logbook export', 'Maintenance scheduling', 'Cost reports'],
    },
  },
  broodz: {
    free: {
      name: 'Free',
      priceCents: 0,
      frequency: 'monthly',
      features: ['Full profile', '5 gallery images', '3 services', '5 shop items'],
    },
    pro: {
      name: 'Pro',
      priceCents: 4900, // R49/month
      frequency: 'monthly',
      features: ['Unlimited gallery & services', 'Unlimited shop items', 'SEO boost', 'Priority listing', 'Custom themes'],
    },
  },
};

export const VALID_PRODUCT_IDS = Object.keys(PLANS) as ProductId[];

export function getPlan(product: string, plan: string): PlanDef | null {
  const productPlans = PLANS[product as ProductId];
  if (!productPlans) return null;
  return productPlans[plan] || null;
}
