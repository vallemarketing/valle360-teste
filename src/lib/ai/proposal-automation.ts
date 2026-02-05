/**
 * Valle AI - Proposal Automation Service
 * Sistema de automação de propostas comerciais
 */

import { supabase } from '@/lib/supabase';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  price_type: 'fixed' | 'monthly' | 'per_hour' | 'per_project';
  min_contract_months?: number;
  features: string[];
  is_active: boolean;
}

export interface ProposalItem {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  total: number;
}

export interface Proposal {
  id?: string;
  lead_id?: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_company: string;
  items: ProposalItem[];
  subtotal: number;
  discount_total: number;
  total: number;
  valid_until: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  terms?: string;
  created_by: string;
  created_at?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  token?: string;
  payment_terms?: string;
  contract_duration?: number;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  services: string[];
  discount_percent?: number;
  is_default: boolean;
}

class ProposalAutomationService {
  /**
   * Busca serviços configurados pelo Super Admin
   */
  async getServices(category?: string): Promise<Service[]> {
    try {
      let query = supabase
        .from('configurable_services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar serviços:', error);
        return this.getDefaultServices();
      }

      return data || this.getDefaultServices();
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      return this.getDefaultServices();
    }
  }

  /**
   * Serviços padrão caso não haja no banco
   */
  private getDefaultServices(): Service[] {
    return [
      {
        id: 'social-media-basic',
        name: 'Social Media - Básico',
        description: 'Gestão de redes sociais com 12 posts/mês',
        category: 'Social Media',
        base_price: 1500,
        price_type: 'monthly',
        min_contract_months: 3,
        features: ['12 posts/mês', '2 redes sociais', 'Relatório mensal'],
        is_active: true
      },
      {
        id: 'social-media-pro',
        name: 'Social Media - Pro',
        description: 'Gestão completa com 20 posts/mês',
        category: 'Social Media',
        base_price: 2500,
        price_type: 'monthly',
        min_contract_months: 3,
        features: ['20 posts/mês', '3 redes sociais', 'Stories diários', 'Relatório semanal'],
        is_active: true
      },
      {
        id: 'trafego-basico',
        name: 'Tráfego Pago - Básico',
        description: 'Gestão de campanhas até R$ 3.000/mês',
        category: 'Tráfego Pago',
        base_price: 1200,
        price_type: 'monthly',
        min_contract_months: 3,
        features: ['Até R$ 3.000 em ads', 'Google ou Meta', 'Relatório quinzenal'],
        is_active: true
      },
      {
        id: 'trafego-pro',
        name: 'Tráfego Pago - Pro',
        description: 'Gestão de campanhas até R$ 10.000/mês',
        category: 'Tráfego Pago',
        base_price: 2500,
        price_type: 'monthly',
        min_contract_months: 6,
        features: ['Até R$ 10.000 em ads', 'Google + Meta', 'Relatório semanal', 'Otimização diária'],
        is_active: true
      },
      {
        id: 'design-pack',
        name: 'Pack Design Mensal',
        description: '20 peças gráficas por mês',
        category: 'Design',
        base_price: 1800,
        price_type: 'monthly',
        min_contract_months: 3,
        features: ['20 peças/mês', 'Revisões ilimitadas', 'Formatos variados'],
        is_active: true
      },
      {
        id: 'video-reels',
        name: 'Produção de Reels',
        description: '8 vídeos curtos por mês',
        category: 'Vídeo',
        base_price: 2200,
        price_type: 'monthly',
        min_contract_months: 3,
        features: ['8 vídeos/mês', 'Edição profissional', 'Legendas', 'Trilha sonora'],
        is_active: true
      },
      {
        id: 'site-institucional',
        name: 'Site Institucional',
        description: 'Site responsivo até 5 páginas',
        category: 'Web',
        base_price: 4500,
        price_type: 'fixed',
        features: ['Até 5 páginas', 'Responsivo', 'SEO básico', 'Formulário de contato'],
        is_active: true
      },
      {
        id: 'ecommerce',
        name: 'E-commerce Completo',
        description: 'Loja virtual com até 100 produtos',
        category: 'Web',
        base_price: 8500,
        price_type: 'fixed',
        features: ['Até 100 produtos', 'Gateway de pagamento', 'Painel admin', 'Integração correios'],
        is_active: true
      }
    ];
  }

  /**
   * Cria uma nova proposta
   */
  async createProposal(proposal: Omit<Proposal, 'id' | 'token' | 'created_at'>): Promise<Proposal | null> {
    try {
      const token = this.generateToken();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 15); // Válido por 15 dias

      const proposalData = {
        ...proposal,
        token,
        valid_until: proposal.valid_until || validUntil.toISOString(),
        created_at: new Date().toISOString(),
        status: 'draft'
      };

      const { data, error } = await supabase
        .from('proposals')
        .insert(proposalData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar proposta:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      return null;
    }
  }

  /**
   * Gera token único para a proposta
   */
  private generateToken(): string {
    return `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Calcula totais da proposta
   */
  calculateProposalTotals(items: ProposalItem[], globalDiscount?: number): {
    subtotal: number;
    discount_total: number;
    total: number;
  } {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const itemDiscounts = items.reduce((acc, item) => {
      if (item.discount_percent) {
        return acc + (item.unit_price * item.quantity * item.discount_percent / 100);
      }
      return acc;
    }, 0);
    
    const globalDiscountValue = globalDiscount ? (subtotal - itemDiscounts) * globalDiscount / 100 : 0;
    const discount_total = itemDiscounts + globalDiscountValue;
    const total = subtotal - discount_total;

    return { subtotal, discount_total, total };
  }

  /**
   * Envia proposta por email
   */
  async sendProposal(proposalId: string): Promise<boolean> {
    try {
      // Atualiza status para 'sent'
      const { error } = await supabase
        .from('proposals')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', proposalId);

      if (error) {
        console.error('Erro ao atualizar proposta:', error);
        return false;
      }

      // Aqui integraria com serviço de email (SendGrid, etc)
      // Por enquanto, apenas marca como enviada
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      return false;
    }
  }

  /**
   * Busca proposta por token (para página pública)
   */
  async getProposalByToken(token: string): Promise<Proposal | null> {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('token', token)
        .single();

      if (error) {
        console.error('Erro ao buscar proposta:', error);
        return null;
      }

      // Marca como visualizada se ainda não foi
      if (data && data.status === 'sent') {
        await supabase
          .from('proposals')
          .update({
            status: 'viewed',
            viewed_at: new Date().toISOString()
          })
          .eq('id', data.id);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar proposta:', error);
      return null;
    }
  }

  /**
   * Aceita proposta (cliente)
   */
  async acceptProposal(token: string, clientData?: {
    cpf_cnpj?: string;
    address?: string;
    signature?: string;
  }): Promise<boolean> {
    try {
      const proposal = await this.getProposalByToken(token);
      if (!proposal) return false;

      // Verifica se ainda é válida
      if (new Date(proposal.valid_until) < new Date()) {
        await supabase
          .from('proposals')
          .update({ status: 'expired' })
          .eq('token', token);
        return false;
      }

      // Atualiza para aceita
      const { error } = await supabase
        .from('proposals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          client_data: clientData
        })
        .eq('token', token);

      if (error) {
        console.error('Erro ao aceitar proposta:', error);
        return false;
      }

      // Dispara workflow para criar contrato
      await this.triggerContractCreation(proposal);

      return true;
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
      return false;
    }
  }

  /**
   * Dispara criação de contrato após aceite
   */
  private async triggerContractCreation(proposal: Proposal): Promise<void> {
    try {
      // Cria registro na fila de contratos
      await supabase
        .from('contract_queue')
        .insert({
          proposal_id: proposal.id,
          client_name: proposal.client_name,
          client_email: proposal.client_email,
          client_company: proposal.client_company,
          total_value: proposal.total,
          services: proposal.items.map(i => i.service_name),
          status: 'pending',
          created_at: new Date().toISOString()
        });

      // Notifica Jurídico
      try {
        const { data: admins } = await supabase
          .from('user_profiles')
          .select('user_id, user_type')
          .in('user_type', ['super_admin', 'admin']);

        const userIds = (admins || [])
          .map((r: any) => r.user_id)
          .filter(Boolean)
          .map((id: any) => String(id));

        if (userIds.length > 0) {
          await supabase.from('notifications').insert(
            userIds.map((userId) => ({
              user_id: userId,
              type: 'contract_pending',
              title: 'Nova proposta aceita - Contrato pendente',
              message: `Proposta para ${proposal.client_company} foi aceita.`,
              link: '/admin/contratos',
              metadata: { proposal_id: proposal.id, target_role: 'juridico' },
              is_read: false,
              created_at: new Date().toISOString(),
            }))
          );
        }
      } catch {
        // best-effort
      }

    } catch (error) {
      console.error('Erro ao disparar criação de contrato:', error);
    }
  }

  /**
   * Busca propostas do comercial
   */
  async getProposals(filters?: {
    status?: string;
    created_by?: string;
    client_id?: string;
  }): Promise<Proposal[]> {
    try {
      let query = supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar propostas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
      return [];
    }
  }

  /**
   * Gera PDF da proposta (estrutura)
   */
  generateProposalPDF(proposal: Proposal): string {
    // Em produção, usaria biblioteca como jsPDF ou puppeteer
    // Por enquanto, retorna HTML para renderização
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposta - ${proposal.client_company}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: bold; color: #1672d6; }
          .client-info { margin-bottom: 30px; }
          .services-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .services-table th, .services-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .services-table th { background: #1672d6; color: white; }
          .totals { text-align: right; margin-top: 20px; }
          .total-final { font-size: 24px; font-weight: bold; color: #1672d6; }
          .terms { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Valle Group</div>
          <p>Proposta Comercial</p>
        </div>
        
        <div class="client-info">
          <h2>${proposal.client_company}</h2>
          <p>${proposal.client_name}</p>
          <p>${proposal.client_email}</p>
        </div>
        
        <table class="services-table">
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Qtd</th>
              <th>Valor Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.items.map(item => `
              <tr>
                <td>${item.service_name}</td>
                <td>${item.quantity}</td>
                <td>R$ ${item.unit_price.toLocaleString('pt-BR')}</td>
                <td>R$ ${item.total.toLocaleString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: R$ ${proposal.subtotal.toLocaleString('pt-BR')}</p>
          ${proposal.discount_total > 0 ? `<p>Desconto: -R$ ${proposal.discount_total.toLocaleString('pt-BR')}</p>` : ''}
          <p class="total-final">Total: R$ ${proposal.total.toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="terms">
          <p><strong>Validade:</strong> ${new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</p>
          ${proposal.terms ? `<p>${proposal.terms}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }
}

export const proposalAutomation = new ProposalAutomationService();
export default proposalAutomation;




