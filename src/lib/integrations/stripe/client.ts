// Stripe Integration Client
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(secretKey?: string): Stripe {
  const key = secretKey || process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    throw new Error('Stripe Secret Key não configurada');
  }

  if (!stripeClient || secretKey) {
    stripeClient = new Stripe(key, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  return stripeClient;
}

// Testar conexão
export async function testStripeConnection(secretKey: string): Promise<boolean> {
  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
    await stripe.balance.retrieve();
    return true;
  } catch {
    return false;
  }
}

// ========== CLIENTES ==========

export async function createCustomer(
  data: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  },
  secretKey?: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient(secretKey);
  return stripe.customers.create(data);
}

export async function getCustomer(
  customerId: string,
  secretKey?: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient(secretKey);
  return stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
}

export async function updateCustomer(
  customerId: string,
  data: Stripe.CustomerUpdateParams,
  secretKey?: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient(secretKey);
  return stripe.customers.update(customerId, data);
}

// ========== PAGAMENTOS ==========

export async function createPaymentIntent(
  data: {
    amount: number; // em centavos
    currency?: string;
    customerId?: string;
    description?: string;
    metadata?: Record<string, string>;
  },
  secretKey?: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient(secretKey);
  return stripe.paymentIntents.create({
    amount: data.amount,
    currency: data.currency || 'brl',
    customer: data.customerId,
    description: data.description,
    metadata: data.metadata,
    automatic_payment_methods: { enabled: true }
  });
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string,
  secretKey?: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient(secretKey);
  return stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId
  });
}

// ========== ASSINATURAS ==========

export async function createSubscription(
  data: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  },
  secretKey?: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient(secretKey);
  
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: data.customerId,
    items: [{ price: data.priceId }],
    metadata: data.metadata,
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  };

  if (data.trialDays) {
    subscriptionData.trial_period_days = data.trialDays;
  }

  return stripe.subscriptions.create(subscriptionData);
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false,
  secretKey?: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient(secretKey);
  
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });
}

export async function getSubscription(
  subscriptionId: string,
  secretKey?: string
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient(secretKey);
  return stripe.subscriptions.retrieve(subscriptionId);
}

// ========== PRODUTOS E PREÇOS ==========

export async function createProduct(
  data: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  },
  secretKey?: string
): Promise<Stripe.Product> {
  const stripe = getStripeClient(secretKey);
  return stripe.products.create(data);
}

export async function createPrice(
  data: {
    productId: string;
    unitAmount: number; // em centavos
    currency?: string;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    };
  },
  secretKey?: string
): Promise<Stripe.Price> {
  const stripe = getStripeClient(secretKey);
  
  const priceData: Stripe.PriceCreateParams = {
    product: data.productId,
    unit_amount: data.unitAmount,
    currency: data.currency || 'brl'
  };

  if (data.recurring) {
    priceData.recurring = {
      interval: data.recurring.interval,
      interval_count: data.recurring.intervalCount
    };
  }

  return stripe.prices.create(priceData);
}

export async function listProducts(
  limit: number = 100,
  secretKey?: string
): Promise<Stripe.Product[]> {
  const stripe = getStripeClient(secretKey);
  const response = await stripe.products.list({ limit, active: true });
  return response.data;
}

export async function listPrices(
  productId?: string,
  limit: number = 100,
  secretKey?: string
): Promise<Stripe.Price[]> {
  const stripe = getStripeClient(secretKey);
  const params: Stripe.PriceListParams = { limit, active: true };
  if (productId) params.product = productId;
  const response = await stripe.prices.list(params);
  return response.data;
}

// ========== FATURAS ==========

export async function createInvoice(
  data: {
    customerId: string;
    description?: string;
    dueDate?: Date;
    items: Array<{
      description: string;
      amount: number; // em centavos
      quantity?: number;
    }>;
  },
  secretKey?: string
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient(secretKey);

  // Criar itens da fatura
  for (const item of data.items) {
    await stripe.invoiceItems.create({
      customer: data.customerId,
      description: item.description,
      unit_amount: item.amount,
      quantity: item.quantity || 1
    });
  }

  // Criar fatura
  const invoice = await stripe.invoices.create({
    customer: data.customerId,
    description: data.description,
    due_date: data.dueDate ? Math.floor(data.dueDate.getTime() / 1000) : undefined,
    auto_advance: true
  });

  // Finalizar fatura
  return stripe.invoices.finalizeInvoice(invoice.id);
}

export async function sendInvoice(
  invoiceId: string,
  secretKey?: string
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient(secretKey);
  return stripe.invoices.sendInvoice(invoiceId);
}

export async function listInvoices(
  customerId?: string,
  status?: Stripe.Invoice.Status,
  limit: number = 100,
  secretKey?: string
): Promise<Stripe.Invoice[]> {
  const stripe = getStripeClient(secretKey);
  const params: Stripe.InvoiceListParams = { limit };
  if (customerId) params.customer = customerId;
  if (status) params.status = status;
  const response = await stripe.invoices.list(params);
  return response.data;
}

// ========== CHECKOUT ==========

export async function createCheckoutSession(
  data: {
    customerId?: string;
    customerEmail?: string;
    lineItems: Array<{
      priceId?: string;
      name?: string;
      amount?: number;
      quantity: number;
    }>;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  },
  secretKey?: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient(secretKey);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = data.lineItems.map(item => {
    if (item.priceId) {
      return { price: item.priceId, quantity: item.quantity };
    }
    return {
      price_data: {
        currency: 'brl',
        product_data: { name: item.name || 'Produto' },
        unit_amount: item.amount || 0
      },
      quantity: item.quantity
    };
  });

  return stripe.checkout.sessions.create({
    customer: data.customerId,
    customer_email: data.customerEmail,
    line_items: lineItems,
    mode: data.mode,
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
    metadata: data.metadata
  });
}

// ========== WEBHOOKS ==========

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// ========== RELATÓRIOS ==========

export async function getBalance(secretKey?: string): Promise<Stripe.Balance> {
  const stripe = getStripeClient(secretKey);
  return stripe.balance.retrieve();
}

export async function listTransactions(
  limit: number = 100,
  secretKey?: string
): Promise<Stripe.BalanceTransaction[]> {
  const stripe = getStripeClient(secretKey);
  const response = await stripe.balanceTransactions.list({ limit });
  return response.data;
}

export async function getPayouts(
  limit: number = 100,
  secretKey?: string
): Promise<Stripe.Payout[]> {
  const stripe = getStripeClient(secretKey);
  const response = await stripe.payouts.list({ limit });
  return response.data;
}






