import { NextRequest, NextResponse } from 'next/server';
import { contractGenerator, type Contract } from '@/lib/ai/contract-generator';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar contratos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const client_id = searchParams.get('client_id') || undefined;
    const expiring_soon = searchParams.get('expiring_soon') === 'true';
    const id = searchParams.get('id');

    // Buscar contrato específico
    if (id) {
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, contract });
    }

    // Buscar lista de contratos
    const contracts = await contractGenerator.getContracts({
      status,
      client_id,
      expiring_soon
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar contratos' },
      { status: 500 }
    );
  }
}

// POST - Criar contrato ou executar ação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Gerar contrato a partir de proposta
    if (action === 'generate_from_proposal') {
      const { proposal_id, created_by } = data;

      if (!proposal_id || !created_by) {
        return NextResponse.json(
          { success: false, error: 'proposal_id e created_by são obrigatórios' },
          { status: 400 }
        );
      }

      const contract = await contractGenerator.generateFromProposal(proposal_id, created_by);

      if (!contract) {
        return NextResponse.json(
          { success: false, error: 'Erro ao gerar contrato' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, contract });
    }

    // Gerar documento do contrato
    if (action === 'generate_document') {
      const { contract_id } = data;

      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .single();

      if (error || !contract) {
        return NextResponse.json(
          { success: false, error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      const document = contractGenerator.generateContractDocument(contract);
      return NextResponse.json({ success: true, document });
    }

    // Enviar para assinatura
    if (action === 'send_for_signature') {
      const { contract_id } = data;

      const success = await contractGenerator.sendForSignature(contract_id);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Erro ao enviar para assinatura' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Contrato enviado para assinatura' });
    }

    // Calcular multa de rescisão
    if (action === 'calculate_cancellation_fee') {
      const { contract_id } = data;

      const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .single();

      if (error || !contract) {
        return NextResponse.json(
          { success: false, error: 'Contrato não encontrado' },
          { status: 404 }
        );
      }

      const fee = contractGenerator.calculateCancellationFee(contract);
      return NextResponse.json({ success: true, fee });
    }

    // Criar contrato manualmente
    const contractData: Partial<Contract> = {
      client_name: data.client_name,
      client_email: data.client_email,
      client_company: data.client_company,
      client_cnpj: data.client_cnpj,
      client_address: data.client_address,
      services: data.services || [],
      total_value: data.total_value,
      payment_terms: data.payment_terms || 'Mensal',
      duration_months: data.duration_months || 6,
      start_date: data.start_date || new Date().toISOString(),
      end_date: data.end_date,
      status: 'draft',
      created_at: new Date().toISOString(),
      created_by: data.created_by,
      template_used: data.template || 'standard',
      renewal_type: data.renewal_type || 'manual',
      cancellation_fee_percent: data.cancellation_fee_percent || 30,
      cancellation_notice_days: data.cancellation_notice_days || 30
    };

    // Calcula data de término se não fornecida
    if (!contractData.end_date && contractData.start_date) {
      const endDate = new Date(contractData.start_date);
      endDate.setMonth(endDate.getMonth() + (contractData.duration_months || 6));
      contractData.end_date = endDate.toISOString();
    }

    const { data: savedContract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar contrato' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, contract: savedContract });
  } catch (error) {
    console.error('Erro na API de contratos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar contrato ou assinar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do contrato é obrigatório' },
        { status: 400 }
      );
    }

    // Assinar contrato
    if (action === 'sign') {
      const success = await contractGenerator.signContract(id, {
        signed_by: data.signed_by,
        signature_ip: data.signature_ip,
        signature_hash: data.signature_hash
      });

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Erro ao assinar contrato' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Contrato assinado com sucesso' });
    }

    // Cancelar contrato
    if (action === 'cancel') {
      const { data: contract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (contract) {
        const fee = contractGenerator.calculateCancellationFee(contract);

        await supabase
          .from('contracts')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_fee: fee.fee_value,
            cancellation_reason: data.reason
          })
          .eq('id', id);
      }

      return NextResponse.json({ success: true, message: 'Contrato cancelado' });
    }

    // Ativar contrato
    if (action === 'activate') {
      await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', id);

      return NextResponse.json({ success: true, message: 'Contrato ativado' });
    }

    // Atualização geral
    const { error } = await supabase
      .from('contracts')
      .update(data)
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar contrato' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Contrato atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar contrato' },
      { status: 500 }
    );
  }
}




