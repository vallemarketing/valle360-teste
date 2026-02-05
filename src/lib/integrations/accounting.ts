/**
 * Accounting System Integration
 * Supports Omie, ContaAzul, and other Brazilian accounting systems
 */

// Types
export interface AccountingConfig {
  provider: 'omie' | 'contaazul' | 'bling' | 'nfe_io';
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
  companyId?: string;
}

export interface Invoice {
  number: string;
  client: {
    name: string;
    document: string; // CPF or CNPJ
    email: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    serviceCode?: string;
  }>;
  totalAmount: number;
  dueDate: string;
  issueDate: string;
  paymentMethod?: string;
  notes?: string;
}

export interface SyncResult {
  success: boolean;
  externalId?: string;
  nfseNumber?: string;
  error?: string;
}

// Configuration from environment
function getConfig(): AccountingConfig {
  const provider = (process.env.ACCOUNTING_PROVIDER || 'omie') as AccountingConfig['provider'];
  
  switch (provider) {
    case 'contaazul':
      return {
        provider: 'contaazul',
        accessToken: process.env.CONTAAZUL_ACCESS_TOKEN || '',
        companyId: process.env.CONTAAZUL_COMPANY_ID || '',
      };
    case 'bling':
      return {
        provider: 'bling',
        accessToken: process.env.BLING_API_KEY || '',
      };
    case 'nfe_io':
      return {
        provider: 'nfe_io',
        accessToken: process.env.NFEIO_API_KEY || '',
        companyId: process.env.NFEIO_COMPANY_ID || '',
      };
    default: // omie
      return {
        provider: 'omie',
        appKey: process.env.OMIE_APP_KEY || '',
        appSecret: process.env.OMIE_APP_SECRET || '',
      };
  }
}

/**
 * Sync invoice to accounting system
 */
export async function syncInvoice(invoice: Invoice): Promise<SyncResult> {
  const config = getConfig();
  
  if (!config.accessToken && !config.appKey) {
    console.warn('Accounting system not configured');
    return { success: false, error: 'Accounting system not configured' };
  }

  try {
    switch (config.provider) {
      case 'omie':
        return await syncToOmie(config, invoice);
      case 'contaazul':
        return await syncToContaAzul(config, invoice);
      case 'bling':
        return await syncToBling(config, invoice);
      case 'nfe_io':
        return await emitNfse(config, invoice);
      default:
        return { success: false, error: 'Unknown provider' };
    }
  } catch (error: any) {
    console.error('Accounting sync error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync to Omie ERP
 * https://developer.omie.com.br/
 */
async function syncToOmie(config: AccountingConfig, invoice: Invoice): Promise<SyncResult> {
  const baseUrl = 'https://app.omie.com.br/api/v1/';
  
  // First, create or update client
  const clientResponse = await fetch(`${baseUrl}geral/clientes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call: 'UpsertCliente',
      app_key: config.appKey,
      app_secret: config.appSecret,
      param: [{
        codigo_cliente_integracao: invoice.client.document.replace(/\D/g, ''),
        razao_social: invoice.client.name,
        cnpj_cpf: invoice.client.document,
        email: invoice.client.email,
        endereco: invoice.client.address?.street,
        endereco_numero: invoice.client.address?.number,
        bairro: invoice.client.address?.neighborhood,
        cidade: invoice.client.address?.city,
        estado: invoice.client.address?.state,
        cep: invoice.client.address?.zipCode,
      }],
    }),
  });

  const clientData = await clientResponse.json();
  if (!clientResponse.ok || clientData.faultstring) {
    return { success: false, error: clientData.faultstring || 'Failed to sync client' };
  }

  const clientCode = clientData.codigo_cliente_omie;

  // Create service order (OS)
  const osResponse = await fetch(`${baseUrl}servicos/os/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call: 'IncluirOS',
      app_key: config.appKey,
      app_secret: config.appSecret,
      param: [{
        cabecalho: {
          codigo_cliente: clientCode,
          data_previsao: formatDate(invoice.dueDate),
          etapa: '10', // Em andamento
          numero_pedido: invoice.number,
        },
        det: invoice.items.map((item, index) => ({
          ide: { codigo_item_integracao: `${invoice.number}-${index}` },
          servico: {
            descricao: item.description,
            quantidade: item.quantity,
            valor_unitario: item.unitPrice,
          },
        })),
        observacoes: {
          obs_venda: invoice.notes || '',
        },
      }],
    }),
  });

  const osData = await osResponse.json();
  if (!osResponse.ok || osData.faultstring) {
    return { success: false, error: osData.faultstring || 'Failed to create order' };
  }

  return {
    success: true,
    externalId: osData.codigo_os?.toString(),
  };
}

/**
 * Sync to ContaAzul
 * https://developers.contaazul.com/
 */
async function syncToContaAzul(config: AccountingConfig, invoice: Invoice): Promise<SyncResult> {
  const baseUrl = 'https://api.contaazul.com/v1';
  
  // Create or get customer
  const customerResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: invoice.client.name,
      email: invoice.client.email,
      document: invoice.client.document,
      personType: invoice.client.document.length > 11 ? 'LEGAL' : 'NATURAL',
    }),
  });

  let customerId: string;
  if (customerResponse.status === 409) {
    // Customer already exists, search for it
    const searchResponse = await fetch(
      `${baseUrl}/customers?document=${invoice.client.document}`,
      { headers: { 'Authorization': `Bearer ${config.accessToken}` } }
    );
    const customers = await searchResponse.json();
    customerId = customers[0]?.id;
  } else if (!customerResponse.ok) {
    const error = await customerResponse.json();
    return { success: false, error: error.message || 'Failed to create customer' };
  } else {
    const customer = await customerResponse.json();
    customerId = customer.id;
  }

  // Create sale
  const saleResponse = await fetch(`${baseUrl}/sales`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: parseInt(invoice.number.replace(/\D/g, '')),
      emission: formatDate(invoice.issueDate),
      status: 'COMMITTED',
      customer_id: customerId,
      services: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        service_id: null,
        value: item.unitPrice,
      })),
      payment: {
        type: 'CASH',
        installments: [{
          number: 1,
          value: invoice.totalAmount,
          due_date: formatDate(invoice.dueDate),
          status: 'AWAITING_PAYMENT',
        }],
      },
      notes: invoice.notes,
    }),
  });

  if (!saleResponse.ok) {
    const error = await saleResponse.json();
    return { success: false, error: error.message || 'Failed to create sale' };
  }

  const sale = await saleResponse.json();
  return {
    success: true,
    externalId: sale.id,
  };
}

/**
 * Sync to Bling ERP
 * https://developer.bling.com.br/
 */
async function syncToBling(config: AccountingConfig, invoice: Invoice): Promise<SyncResult> {
  const baseUrl = 'https://www.bling.com.br/Api/v3';
  
  // Create contact (customer)
  const contactResponse = await fetch(`${baseUrl}/contatos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nome: invoice.client.name,
      tipoPessoa: invoice.client.document.length > 11 ? 'J' : 'F',
      numeroDocumento: invoice.client.document,
      email: invoice.client.email,
      tipo: 'C', // Cliente
    }),
  });

  // Ignore 409 conflict (already exists)
  if (!contactResponse.ok && contactResponse.status !== 409) {
    const error = await contactResponse.json();
    return { success: false, error: error.error?.message || 'Failed to create contact' };
  }

  // Create order
  const orderResponse = await fetch(`${baseUrl}/pedidos/vendas`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      numero: parseInt(invoice.number.replace(/\D/g, '')),
      data: formatDate(invoice.issueDate),
      contato: { nome: invoice.client.name },
      itens: invoice.items.map(item => ({
        descricao: item.description,
        quantidade: item.quantity,
        valor: item.unitPrice,
      })),
      parcelas: [{
        dataVencimento: formatDate(invoice.dueDate),
        valor: invoice.totalAmount,
      }],
      observacoes: invoice.notes,
    }),
  });

  if (!orderResponse.ok) {
    const error = await orderResponse.json();
    return { success: false, error: error.error?.message || 'Failed to create order' };
  }

  const order = await orderResponse.json();
  return {
    success: true,
    externalId: order.data?.id?.toString(),
  };
}

/**
 * Emit NFSe via NFe.io
 * https://nfe.io/docs
 */
async function emitNfse(config: AccountingConfig, invoice: Invoice): Promise<SyncResult> {
  const baseUrl = 'https://api.nfe.io/v1';
  
  const response = await fetch(`${baseUrl}/companies/${config.companyId}/serviceinvoices`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      borrower: {
        name: invoice.client.name,
        federalTaxNumber: invoice.client.document.replace(/\D/g, ''),
        email: invoice.client.email,
        address: invoice.client.address ? {
          street: invoice.client.address.street,
          number: invoice.client.address.number,
          additionalInformation: '',
          district: invoice.client.address.neighborhood,
          city: { name: invoice.client.address.city },
          state: invoice.client.address.state,
          postalCode: invoice.client.address.zipCode,
        } : undefined,
      },
      cityServiceCode: invoice.items[0]?.serviceCode || '1.01',
      description: invoice.items.map(i => i.description).join('; '),
      servicesAmount: invoice.totalAmount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.message || 'Failed to emit NFSe' };
  }

  const nfse = await response.json();
  return {
    success: true,
    externalId: nfse.id,
    nfseNumber: nfse.number?.toString(),
  };
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

/**
 * Sync payment status to accounting system
 */
export async function syncPaymentStatus(
  externalId: string,
  status: 'paid' | 'cancelled',
  paymentDate?: string
): Promise<SyncResult> {
  const config = getConfig();
  
  if (!config.accessToken && !config.appKey) {
    return { success: false, error: 'Accounting system not configured' };
  }

  // Implementation would depend on the provider
  console.log(`Would sync payment status: ${externalId} -> ${status}`);
  
  return { success: true };
}

/**
 * Get financial reports from accounting system
 */
export async function getFinancialReport(startDate: string, endDate: string): Promise<any> {
  const config = getConfig();
  
  if (!config.accessToken && !config.appKey) {
    return { success: false, error: 'Accounting system not configured' };
  }

  // Implementation would depend on the provider
  console.log(`Would fetch report from ${startDate} to ${endDate}`);
  
  return { success: true, data: [] };
}
