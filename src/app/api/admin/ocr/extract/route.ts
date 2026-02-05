import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OCR service not configured' }, { status: 500 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/png';

    // Use GPT-4 Vision to extract data
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em extrair dados de documentos brasileiros.
Extraia as seguintes informações do documento enviado:
- Nome completo (clientName)
- Nome da empresa (clientCompany)
- CNPJ ou CPF (clientCNPJ)
- Endereço completo (clientAddress)
- Email (clientEmail)
- Telefone (clientPhone)

Retorne APENAS um JSON válido com esses campos. Se não encontrar algum campo, deixe como null.
Exemplo: {"clientName": "João Silva", "clientCompany": "Empresa Ltda", "clientCNPJ": "00.000.000/0001-00", "clientAddress": null, "clientEmail": null, "clientPhone": null}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: 'Extraia os dados deste documento brasileiro (RG, CNPJ, Contrato Social, ou similar). Retorne apenas o JSON.',
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse OCR response:', content);
      extractedData = {
        raw: content,
        error: 'Failed to parse extracted data',
      };
    }

    // Log the extraction (best-effort)
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ocr_extract',
        resource_type: 'document',
        metadata: {
          filename: file.name,
          size: file.size,
          extracted: extractedData,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit log is best-effort, ignore errors
    }

    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract data from document' },
      { status: 500 }
    );
  }
}
