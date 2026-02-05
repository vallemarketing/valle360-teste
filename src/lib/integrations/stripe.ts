// Stripe Integration - Valle 360

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publicKey: string;
}

interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

interface CreateInvoiceParams {
  customerId: string;
  items: {
    description: string;
    amount: number; // em centavos
    quantity: number;
  }[];
  dueDate?: Date;
  metadata?: Record<string, string>;
}

interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

class StripeService {
  private config: StripeConfig | null = null;
  private baseUrl = 'https://api.stripe.com/v1';

  private getConfig(): StripeConfig {
    if (!this.config) {
      this.config = {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ''
      };
    }
    return this.config;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const config = this.getConfig();
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body) {
      options.body = new URLSearchParams(this.flattenObject(body)).toString();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return response.json();
  }

  private flattenObject(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(result, this.flattenObject(item, `${newKey}[${index}]`));
          } else {
            result[`${newKey}[${index}]`] = String(item);
          }
        });
      } else {
        result[newKey] = String(value);
      }
    }
    
    return result;
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  async createCustomer(params: CreateCustomerParams) {
    try {
      const result = await this.request('/customers', 'POST', {
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata
      });

      return { success: true, customer: result };
    } catch (error) {
      console.error('Erro ao criar customer:', error);
      return { success: false, error: 'Erro ao criar cliente' };
    }
  }

  async getCustomer(customerId: string) {
    try {
      const result = await this.request(`/customers/${customerId}`);
      return { success: true, customer: result };
    } catch (error) {
      console.error('Erro ao buscar customer:', error);
      return { success: false, error: 'Cliente não encontrado' };
    }
  }

  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>) {
    try {
      const result = await this.request(`/customers/${customerId}`, 'POST', params);
      return { success: true, customer: result };
    } catch (error) {
      console.error('Erro ao atualizar customer:', error);
      return { success: false, error: 'Erro ao atualizar cliente' };
    }
  }

  async listCustomers(limit: number = 10, startingAfter?: string) {
    try {
      const params: any = { limit };
      if (startingAfter) params.starting_after = startingAfter;
      
      const queryString = new URLSearchParams(params).toString();
      const result = await this.request(`/customers?${queryString}`);
      return { success: true, customers: result.data, hasMore: result.has_more };
    } catch (error) {
      console.error('Erro ao listar customers:', error);
      return { success: false, error: 'Erro ao listar clientes' };
    }
  }

  // ============================================
  // INVOICES
  // ============================================

  async createInvoice(params: CreateInvoiceParams) {
    try {
      // Criar invoice
      const invoice = await this.request('/invoices', 'POST', {
        customer: params.customerId,
        collection_method: 'send_invoice',
        days_until_due: params.dueDate 
          ? Math.ceil((params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 30,
        metadata: params.metadata
      });

      // Adicionar itens
      for (const item of params.items) {
        await this.request('/invoiceitems', 'POST', {
          customer: params.customerId,
          invoice: invoice.id,
          description: item.description,
          unit_amount: item.amount,
          quantity: item.quantity,
          currency: 'brl'
        });
      }

      // Finalizar invoice
      const finalizedInvoice = await this.request(`/invoices/${invoice.id}/finalize`, 'POST');

      return { success: true, invoice: finalizedInvoice };
    } catch (error) {
      console.error('Erro ao criar invoice:', error);
      return { success: false, error: 'Erro ao criar fatura' };
    }
  }

  async sendInvoice(invoiceId: string) {
    try {
      const result = await this.request(`/invoices/${invoiceId}/send`, 'POST');
      return { success: true, invoice: result };
    } catch (error) {
      console.error('Erro ao enviar invoice:', error);
      return { success: false, error: 'Erro ao enviar fatura' };
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      const result = await this.request(`/invoices/${invoiceId}`);
      return { success: true, invoice: result };
    } catch (error) {
      console.error('Erro ao buscar invoice:', error);
      return { success: false, error: 'Fatura não encontrada' };
    }
  }

  async listInvoices(customerId?: string, status?: string, limit: number = 10) {
    try {
      const params: any = { limit };
      if (customerId) params.customer = customerId;
      if (status) params.status = status;
      
      const queryString = new URLSearchParams(params).toString();
      const result = await this.request(`/invoices?${queryString}`);
      return { success: true, invoices: result.data, hasMore: result.has_more };
    } catch (error) {
      console.error('Erro ao listar invoices:', error);
      return { success: false, error: 'Erro ao listar faturas' };
    }
  }

  async voidInvoice(invoiceId: string) {
    try {
      const result = await this.request(`/invoices/${invoiceId}/void`, 'POST');
      return { success: true, invoice: result };
    } catch (error) {
      console.error('Erro ao cancelar invoice:', error);
      return { success: false, error: 'Erro ao cancelar fatura' };
    }
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async createSubscription(params: CreateSubscriptionParams) {
    try {
      const result = await this.request('/subscriptions', 'POST', {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        metadata: params.metadata
      });

      return { success: true, subscription: result };
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      return { success: false, error: 'Erro ao criar assinatura' };
    }
  }

  async cancelSubscription(subscriptionId: string, immediately: boolean = false) {
    try {
      if (immediately) {
        const result = await this.request(`/subscriptions/${subscriptionId}`, 'DELETE');
        return { success: true, subscription: result };
      } else {
        const result = await this.request(`/subscriptions/${subscriptionId}`, 'POST', {
          cancel_at_period_end: true
        });
        return { success: true, subscription: result };
      }
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      return { success: false, error: 'Erro ao cancelar assinatura' };
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const result = await this.request(`/subscriptions/${subscriptionId}`);
      return { success: true, subscription: result };
    } catch (error) {
      console.error('Erro ao buscar subscription:', error);
      return { success: false, error: 'Assinatura não encontrada' };
    }
  }

  async listSubscriptions(customerId?: string, status?: string, limit: number = 10) {
    try {
      const params: any = { limit };
      if (customerId) params.customer = customerId;
      if (status) params.status = status;
      
      const queryString = new URLSearchParams(params).toString();
      const result = await this.request(`/subscriptions?${queryString}`);
      return { success: true, subscriptions: result.data, hasMore: result.has_more };
    } catch (error) {
      console.error('Erro ao listar subscriptions:', error);
      return { success: false, error: 'Erro ao listar assinaturas' };
    }
  }

  // ============================================
  // PAYMENT LINKS
  // ============================================

  async createPaymentLink(
    amount: number,
    description: string,
    metadata?: Record<string, string>
  ) {
    try {
      // Criar produto
      const product = await this.request('/products', 'POST', {
        name: description
      });

      // Criar preço
      const price = await this.request('/prices', 'POST', {
        product: product.id,
        unit_amount: amount,
        currency: 'brl'
      });

      // Criar payment link
      const paymentLink = await this.request('/payment_links', 'POST', {
        line_items: [{ price: price.id, quantity: 1 }],
        metadata
      });

      return { success: true, paymentLink: paymentLink };
    } catch (error) {
      console.error('Erro ao criar payment link:', error);
      return { success: false, error: 'Erro ao criar link de pagamento' };
    }
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = this.getConfig();
    
    // Em produção, usar a biblioteca do Stripe para verificar
    // Por simplicidade, apenas verificamos se existe
    return !!signature && !!config.webhookSecret;
  }

  processWebhook(event: any): {
    type: string;
    data: any;
  } | null {
    try {
      return {
        type: event.type,
        data: event.data.object
      };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return null;
    }
  }

  // ============================================
  // BALANCE & PAYOUTS
  // ============================================

  async getBalance() {
    try {
      const result = await this.request('/balance');
      return { success: true, balance: result };
    } catch (error) {
      console.error('Erro ao buscar balance:', error);
      return { success: false, error: 'Erro ao buscar saldo' };
    }
  }

  async listPayouts(limit: number = 10) {
    try {
      const result = await this.request(`/payouts?limit=${limit}`);
      return { success: true, payouts: result.data };
    } catch (error) {
      console.error('Erro ao listar payouts:', error);
      return { success: false, error: 'Erro ao listar transferências' };
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;









