/**
 * Valle AI - Contract Generator Service
 * Sistema de geração automática de contratos
 */

import { supabase } from '@/lib/supabase';

export interface Contract {
  id?: string;
  proposal_id?: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  client_company: string;
  client_cnpj?: string;
  client_address?: string;
  services: ContractService[];
  total_value: number;
  payment_terms: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'active' | 'cancelled' | 'expired';
  signed_at?: string;
  signed_by?: string;
  signature_ip?: string;
  created_at?: string;
  created_by: string;
  template_used: string;
  custom_clauses?: string[];
  attachments?: string[];
  renewal_type: 'auto' | 'manual' | 'none';
  cancellation_fee_percent?: number;
  cancellation_notice_days?: number;
}

export interface ContractService {
  name: string;
  description: string;
  monthly_value: number;
  deliverables: string[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: 'standard' | 'premium' | 'enterprise' | 'custom';
  content: string;
  variables: string[];
  clauses: ContractClause[];
  is_active: boolean;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  is_required: boolean;
  category: 'general' | 'payment' | 'service' | 'confidentiality' | 'termination' | 'liability';
}

// Templates de cláusulas padrão
const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: 'objeto',
    title: 'DO OBJETO',
    content: `O presente contrato tem por objeto a prestação de serviços de marketing digital pela CONTRATADA à CONTRATANTE, conforme especificações detalhadas no Anexo I.`,
    is_required: true,
    category: 'general'
  },
  {
    id: 'valor',
    title: 'DO VALOR E FORMA DE PAGAMENTO',
    content: `Pela execução dos serviços descritos, a CONTRATANTE pagará à CONTRATADA o valor mensal de R$ {{VALOR_MENSAL}} ({{VALOR_EXTENSO}}), com vencimento todo dia {{DIA_VENCIMENTO}} de cada mês.`,
    is_required: true,
    category: 'payment'
  },
  {
    id: 'prazo',
    title: 'DO PRAZO',
    content: `O presente contrato terá vigência de {{DURACAO_MESES}} meses, com início em {{DATA_INICIO}} e término em {{DATA_FIM}}, podendo ser renovado mediante acordo entre as partes.`,
    is_required: true,
    category: 'general'
  },
  {
    id: 'obrigacoes_contratada',
    title: 'DAS OBRIGAÇÕES DA CONTRATADA',
    content: `A CONTRATADA se obriga a:
a) Executar os serviços contratados com zelo e dedicação;
b) Apresentar relatórios mensais de desempenho;
c) Manter sigilo sobre informações confidenciais da CONTRATANTE;
d) Cumprir os prazos estabelecidos para entregas;
e) Comunicar previamente qualquer impedimento na execução dos serviços.`,
    is_required: true,
    category: 'service'
  },
  {
    id: 'obrigacoes_contratante',
    title: 'DAS OBRIGAÇÕES DA CONTRATANTE',
    content: `A CONTRATANTE se obriga a:
a) Efetuar os pagamentos nas datas acordadas;
b) Fornecer materiais e informações necessárias à execução dos serviços;
c) Aprovar ou solicitar alterações nos materiais em até 48 horas úteis;
d) Designar responsável para comunicação com a CONTRATADA.`,
    is_required: true,
    category: 'service'
  },
  {
    id: 'confidencialidade',
    title: 'DA CONFIDENCIALIDADE',
    content: `As partes se comprometem a manter sigilo sobre todas as informações confidenciais compartilhadas durante a vigência deste contrato, por prazo indeterminado, mesmo após seu término.`,
    is_required: true,
    category: 'confidentiality'
  },
  {
    id: 'rescisao',
    title: 'DA RESCISÃO',
    content: `O presente contrato poderá ser rescindido:
a) Por acordo mútuo entre as partes;
b) Por inadimplemento de qualquer cláusula, mediante notificação prévia de {{DIAS_NOTIFICACAO}} dias;
c) Pela CONTRATANTE, mediante aviso prévio de 30 dias e pagamento de multa de {{MULTA_RESCISAO}}% sobre o valor restante do contrato.`,
    is_required: true,
    category: 'termination'
  },
  {
    id: 'multa_atraso',
    title: 'DA MULTA POR ATRASO',
    content: `Em caso de atraso no pagamento, incidirá multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.`,
    is_required: true,
    category: 'payment'
  },
  {
    id: 'propriedade_intelectual',
    title: 'DA PROPRIEDADE INTELECTUAL',
    content: `Todos os materiais desenvolvidos pela CONTRATADA durante a vigência deste contrato serão de propriedade exclusiva da CONTRATANTE após a quitação integral dos valores devidos.`,
    is_required: false,
    category: 'general'
  },
  {
    id: 'foro',
    title: 'DO FORO',
    content: `Fica eleito o foro da Comarca de {{CIDADE_FORO}}/{{ESTADO_FORO}} para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
    is_required: true,
    category: 'general'
  }
];

class ContractGeneratorService {
  /**
   * Gera contrato a partir de uma proposta aceita
   */
  async generateFromProposal(proposalId: string, createdBy: string): Promise<Contract | null> {
    try {
      // Busca a proposta
      const { data: proposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (!proposal || proposal.status !== 'accepted') {
        console.error('Proposta não encontrada ou não aceita');
        return null;
      }

      // Calcula datas
      const startDate = new Date();
      const durationMonths = proposal.contract_duration || 6;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Monta serviços do contrato
      const services: ContractService[] = proposal.items.map((item: any) => ({
        name: item.service_name,
        description: item.description || '',
        monthly_value: item.total / durationMonths,
        deliverables: item.features || []
      }));

      // Cria o contrato
      const contract: Contract = {
        proposal_id: proposalId,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        client_company: proposal.client_company,
        client_cnpj: proposal.client_data?.cpf_cnpj,
        client_address: proposal.client_data?.address,
        services,
        total_value: proposal.total,
        payment_terms: proposal.payment_terms || 'Mensal, vencimento dia 10',
        duration_months: durationMonths,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'draft',
        created_at: new Date().toISOString(),
        created_by: createdBy,
        template_used: 'standard',
        renewal_type: 'manual',
        cancellation_fee_percent: 30,
        cancellation_notice_days: 30
      };

      // Salva no banco
      const { data: savedContract, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar contrato:', error);
        return null;
      }

      // Notifica jurídico
      await this.notifyLegalTeam(savedContract);

      return savedContract;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      return null;
    }
  }

  /**
   * Gera o documento do contrato (HTML/PDF)
   */
  generateContractDocument(contract: Contract, template?: ContractTemplate): string {
    const clauses = template?.clauses || DEFAULT_CLAUSES;
    const today = new Date().toLocaleDateString('pt-BR');
    const monthlyValue = contract.total_value / contract.duration_months;

    // Substitui variáveis
    const replaceVariables = (text: string): string => {
      return text
        .replace(/{{VALOR_MENSAL}}/g, monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        .replace(/{{VALOR_EXTENSO}}/g, this.numberToWords(monthlyValue))
        .replace(/{{DIA_VENCIMENTO}}/g, '10')
        .replace(/{{DURACAO_MESES}}/g, contract.duration_months.toString())
        .replace(/{{DATA_INICIO}}/g, new Date(contract.start_date).toLocaleDateString('pt-BR'))
        .replace(/{{DATA_FIM}}/g, new Date(contract.end_date).toLocaleDateString('pt-BR'))
        .replace(/{{DIAS_NOTIFICACAO}}/g, (contract.cancellation_notice_days || 30).toString())
        .replace(/{{MULTA_RESCISAO}}/g, (contract.cancellation_fee_percent || 30).toString())
        .replace(/{{CIDADE_FORO}}/g, 'São Paulo')
        .replace(/{{ESTADO_FORO}}/g, 'SP');
    };

    const servicesHtml = contract.services.map(service => `
      <div class="service-item">
        <h4>${service.name}</h4>
        <p>${service.description}</p>
        <p><strong>Valor mensal:</strong> R$ ${service.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        ${service.deliverables.length > 0 ? `
          <p><strong>Entregas:</strong></p>
          <ul>
            ${service.deliverables.map(d => `<li>${d}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');

    const clausesHtml = clauses.map((clause, index) => `
      <div class="clause">
        <h3>CLÁUSULA ${index + 1}ª - ${clause.title}</h3>
        <p>${replaceVariables(clause.content)}</p>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Prestação de Serviços - ${contract.client_company}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #1672d6;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #1672d6;
    }
    h1 {
      font-size: 16pt;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      margin-top: 30px;
      color: #1672d6;
    }
    h3 {
      font-size: 12pt;
      margin-top: 20px;
      text-transform: uppercase;
    }
    .parties {
      margin: 30px 0;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .party {
      margin-bottom: 20px;
    }
    .party strong {
      color: #1672d6;
    }
    .clause {
      margin: 20px 0;
      text-align: justify;
    }
    .service-item {
      margin: 15px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .service-item h4 {
      margin: 0 0 10px 0;
      color: #1672d6;
    }
    .signatures {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Valle Group</div>
    <p>CNPJ: 00.000.000/0001-00</p>
    <p>Av. Paulista, 1000 - São Paulo/SP</p>
  </div>

  <h1>Contrato de Prestação de Serviços de Marketing Digital</h1>

  <div class="parties">
    <div class="party">
      <strong>CONTRATADA:</strong> VALLE GROUP MARKETING DIGITAL LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 00.000.000/0001-00, com sede na Av. Paulista, 1000, São Paulo/SP, neste ato representada por seu representante legal.
    </div>
    <div class="party">
      <strong>CONTRATANTE:</strong> ${contract.client_company}, ${contract.client_cnpj ? `inscrita no CNPJ sob nº ${contract.client_cnpj},` : ''} ${contract.client_address ? `com sede em ${contract.client_address},` : ''} neste ato representada por ${contract.client_name}, doravante denominada simplesmente CONTRATANTE.
    </div>
  </div>

  <p>As partes acima qualificadas têm entre si justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições seguintes:</p>

  ${clausesHtml}

  <h2>ANEXO I - SERVIÇOS CONTRATADOS</h2>
  ${servicesHtml}

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        <strong>CONTRATADA</strong><br>
        Valle Group Marketing Digital Ltda
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <strong>CONTRATANTE</strong><br>
        ${contract.client_name}<br>
        ${contract.client_company}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>São Paulo, ${today}</p>
    <p>Contrato gerado automaticamente pelo sistema Valle 360</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Envia contrato para assinatura
   */
  async sendForSignature(contractId: string): Promise<boolean> {
    try {
      const { data: contract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (!contract) return false;

      // Atualiza status
      await supabase
        .from('contracts')
        .update({
          status: 'pending_signature',
          sent_for_signature_at: new Date().toISOString()
        })
        .eq('id', contractId);

      // Em produção, integraria com serviço de assinatura digital (DocuSign, Clicksign, etc)
      console.log(`[CONTRATO] Enviado para assinatura: ${contract.client_email}`);

      return true;
    } catch (error) {
      console.error('Erro ao enviar contrato:', error);
      return false;
    }
  }

  /**
   * Registra assinatura do contrato
   */
  async signContract(contractId: string, signatureData: {
    signed_by: string;
    signature_ip?: string;
    signature_hash?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: signatureData.signed_by,
          signature_ip: signatureData.signature_ip
        })
        .eq('id', contractId);

      if (error) {
        console.error('Erro ao assinar contrato:', error);
        return false;
      }

      // Notifica financeiro para faturamento
      await this.notifyFinanceTeam(contractId);

      return true;
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      return false;
    }
  }

  /**
   * Calcula multa de rescisão
   */
  calculateCancellationFee(contract: Contract): {
    remaining_months: number;
    remaining_value: number;
    fee_percent: number;
    fee_value: number;
  } {
    const endDate = new Date(contract.end_date);
    const today = new Date();
    const remainingMonths = Math.max(0, Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));
    
    const monthlyValue = contract.total_value / contract.duration_months;
    const remainingValue = monthlyValue * remainingMonths;
    const feePercent = contract.cancellation_fee_percent || 30;
    const feeValue = remainingValue * (feePercent / 100);

    return {
      remaining_months: remainingMonths,
      remaining_value: remainingValue,
      fee_percent: feePercent,
      fee_value: feeValue
    };
  }

  /**
   * Busca contratos
   */
  async getContracts(filters?: {
    status?: string;
    client_id?: string;
    expiring_soon?: boolean;
  }): Promise<Contract[]> {
    try {
      let query = supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.expiring_soon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        query = query
          .eq('status', 'active')
          .lte('end_date', thirtyDaysFromNow.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar contratos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      return [];
    }
  }

  // Métodos auxiliares
  private async notifyLegalTeam(contract: Contract): Promise<void> {
    try {
      // No schema atual, notifications é por usuário (auth.users). Em modo teste, avisamos admins.
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id, user_type')
        .in('user_type', ['super_admin', 'admin']);

      const userIds = (admins || [])
        .map((r: any) => r.user_id)
        .filter(Boolean)
        .map((id: any) => String(id));

      if (userIds.length === 0) return;

      await supabase.from('notifications').insert(
        userIds.map((userId) => ({
          user_id: userId,
          type: 'contract_review',
          title: 'Novo contrato para revisão',
          message: `Contrato de ${contract.client_company} aguardando revisão jurídica`,
          link: '/admin/contratos',
          metadata: { contract_id: contract.id, target_role: 'juridico' },
          is_read: false,
          created_at: new Date().toISOString(),
        }))
      );
    } catch {
      // best-effort
    }
  }

  private async notifyFinanceTeam(contractId: string): Promise<void> {
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contract) {
      try {
        const { data: financeUsers } = await supabase
          .from('user_profiles')
          .select('user_id, user_type')
          .in('user_type', ['finance', 'super_admin', 'admin']);

        const userIds = (financeUsers || [])
          .map((r: any) => r.user_id)
          .filter(Boolean)
          .map((id: any) => String(id));

        if (userIds.length === 0) return;

        await supabase.from('notifications').insert(
          userIds.map((userId) => ({
            user_id: userId,
            type: 'contract_signed',
            title: 'Contrato assinado - Iniciar faturamento',
            message: `Contrato de ${contract.client_company} assinado.`,
            link: '/admin/financeiro',
            metadata: { contract_id: contractId, target_role: 'financeiro' },
            is_read: false,
            created_at: new Date().toISOString(),
          }))
        );
      } catch {
        // best-effort
      }
    }
  }

  private numberToWords(num: number): string {
    // Simplificado - em produção usaria biblioteca como extenso.js
    const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return `${formatted} reais`;
  }
}

export const contractGenerator = new ContractGeneratorService();
export default contractGenerator;




