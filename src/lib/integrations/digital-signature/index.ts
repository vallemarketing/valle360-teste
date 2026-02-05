/**
 * Valle 360 - Integração de Assinatura Digital
 * Suporte a DocuSign, ClickSign e Autentique
 */

// =====================================================
// TIPOS
// =====================================================

export type SignatureProvider = 'docusign' | 'clicksign' | 'autentique' | 'internal';

export interface SignatureRequest {
  documentName: string;
  documentContent: string; // Base64 ou URL
  signers: Signer[];
  message?: string;
  expiresAt?: Date;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface Signer {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role?: 'signer' | 'witness' | 'approver';
  order?: number;
}

export interface SignatureResponse {
  success: boolean;
  envelopeId?: string;
  signUrl?: string;
  status?: SignatureStatus;
  error?: string;
}

export type SignatureStatus = 
  | 'created'
  | 'sent'
  | 'delivered'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'voided'
  | 'expired';

export interface SignatureEvent {
  envelopeId: string;
  event: SignatureStatus;
  signerEmail?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// =====================================================
// DOCUSIGN
// =====================================================

class DocuSignProvider {
  private accessToken: string | null = null;
  private accountId: string | null = null;
  private baseUrl = 'https://demo.docusign.net/restapi'; // Use na.docusign.net para produção

  async authenticate(): Promise<boolean> {
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const secretKey = process.env.DOCUSIGN_SECRET_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;

    if (!integrationKey || !secretKey) {
      console.error('DocuSign credentials não configuradas');
      return false;
    }

    // TODO: Implementar OAuth 2.0 com JWT
    // Por enquanto, retorna false se não configurado
    return false;
  }

  async createEnvelope(request: SignatureRequest): Promise<SignatureResponse> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const envelope = {
        emailSubject: `Assine: ${request.documentName}`,
        emailBlurb: request.message || 'Por favor, assine o documento anexo.',
        documents: [{
          documentBase64: request.documentContent,
          name: request.documentName,
          fileExtension: 'pdf',
          documentId: '1'
        }],
        recipients: {
          signers: request.signers.map((signer, idx) => ({
            email: signer.email,
            name: signer.name,
            recipientId: String(idx + 1),
            routingOrder: String(signer.order || idx + 1),
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '700'
              }]
            }
          }))
        },
        status: 'sent'
      };

      const response = await fetch(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(envelope)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();

      return {
        success: true,
        envelopeId: data.envelopeId,
        status: 'sent'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getStatus(envelopeId: string): Promise<SignatureStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.status as SignatureStatus;
    } catch {
      return 'created';
    }
  }
}

// =====================================================
// CLICKSIGN
// =====================================================

class ClickSignProvider {
  private apiKey: string;
  private baseUrl = 'https://sandbox.clicksign.com/api/v1'; // Use app.clicksign.com para produção

  constructor() {
    this.apiKey = process.env.CLICKSIGN_API_KEY || '';
  }

  async createDocument(request: SignatureRequest): Promise<SignatureResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'CLICKSIGN_API_KEY não configurada' };
    }

    try {
      // 1. Criar documento
      const docResponse = await fetch(`${this.baseUrl}/documents?access_token=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            path: `/${request.documentName}`,
            content_base64: request.documentContent,
            deadline_at: request.expiresAt?.toISOString(),
            auto_close: true,
            locale: 'pt-BR',
            sequence_enabled: true
          }
        })
      });

      if (!docResponse.ok) throw new Error(await docResponse.text());
      const docData = await docResponse.json();
      const documentKey = docData.document.key;

      // 2. Adicionar signatários
      for (const signer of request.signers) {
        await fetch(`${this.baseUrl}/lists?access_token=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            list: {
              document_key: documentKey,
              signer_key: await this.getOrCreateSigner(signer),
              sign_as: signer.role === 'witness' ? 'witness' : 'sign',
              group: signer.order || 0
            }
          })
        });
      }

      // 3. Enviar para assinatura
      await fetch(`${this.baseUrl}/documents/${documentKey}/notify?access_token=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: request.message || 'Por favor, assine o documento.'
        })
      });

      return {
        success: true,
        envelopeId: documentKey,
        status: 'sent'
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async getOrCreateSigner(signer: Signer): Promise<string> {
    const response = await fetch(`${this.baseUrl}/signers?access_token=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signer: {
          email: signer.email,
          name: signer.name,
          phone_number: signer.phone,
          documentation: signer.cpf,
          birthday: null,
          has_documentation: !!signer.cpf
        }
      })
    });

    const data = await response.json();
    return data.signer.key;
  }

  async getStatus(documentKey: string): Promise<SignatureStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/documents/${documentKey}?access_token=${this.apiKey}`
      );
      const data = await response.json();
      
      const statusMap: Record<string, SignatureStatus> = {
        'running': 'sent',
        'closed': 'completed',
        'canceled': 'voided'
      };
      
      return statusMap[data.document.status] || 'created';
    } catch {
      return 'created';
    }
  }
}

// =====================================================
// AUTENTIQUE
// =====================================================

class AutentiqueProvider {
  private token: string;
  private baseUrl = 'https://api.autentique.com.br/v2/graphql';

  constructor() {
    this.token = process.env.AUTENTIQUE_TOKEN || '';
  }

  async createDocument(request: SignatureRequest): Promise<SignatureResponse> {
    if (!this.token) {
      return { success: false, error: 'AUTENTIQUE_TOKEN não configurada' };
    }

    try {
      const mutation = `
        mutation CreateDocument($document: DocumentInput!) {
          createDocument(document: $document) {
            id
            name
            signatures {
              public_id
              link
            }
          }
        }
      `;

      const variables = {
        document: {
          name: request.documentName,
          content_base64: request.documentContent,
          signers: request.signers.map(s => ({
            email: s.email,
            name: s.name,
            action: s.role === 'witness' ? 'WITNESS' : 'SIGN'
          }))
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return {
        success: true,
        envelopeId: data.data.createDocument.id,
        signUrl: data.data.createDocument.signatures[0]?.link,
        status: 'sent'
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// =====================================================
// SERVIÇO PRINCIPAL
// =====================================================

class DigitalSignatureService {
  private docusign = new DocuSignProvider();
  private clicksign = new ClickSignProvider();
  private autentique = new AutentiqueProvider();

  /**
   * Envia documento para assinatura
   */
  async sendForSignature(
    request: SignatureRequest,
    provider: SignatureProvider = 'clicksign'
  ): Promise<SignatureResponse> {
    switch (provider) {
      case 'docusign':
        return this.docusign.createEnvelope(request);
      case 'clicksign':
        return this.clicksign.createDocument(request);
      case 'autentique':
        return this.autentique.createDocument(request);
      case 'internal':
        return this.createInternalSignature(request);
      default:
        return { success: false, error: 'Provider não suportado' };
    }
  }

  /**
   * Assinatura interna via Magic Link
   */
  private async createInternalSignature(request: SignatureRequest): Promise<SignatureResponse> {
    // Gera token único para cada signatário
    const tokens = request.signers.map(signer => ({
      email: signer.email,
      token: crypto.randomUUID(),
      signUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinar/${crypto.randomUUID()}`
    }));

    return {
      success: true,
      envelopeId: crypto.randomUUID(),
      signUrl: tokens[0].signUrl,
      status: 'sent'
    };
  }

  /**
   * Verifica status de um documento
   */
  async getStatus(
    envelopeId: string,
    provider: SignatureProvider = 'clicksign'
  ): Promise<SignatureStatus> {
    switch (provider) {
      case 'docusign':
        return this.docusign.getStatus(envelopeId);
      case 'clicksign':
        return this.clicksign.getStatus(envelopeId);
      default:
        return 'created';
    }
  }

  /**
   * Retorna provider recomendado baseado em configuração
   */
  getConfiguredProvider(): SignatureProvider {
    if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
    if (process.env.CLICKSIGN_API_KEY) return 'clicksign';
    if (process.env.AUTENTIQUE_TOKEN) return 'autentique';
    return 'internal';
  }
}

export const digitalSignature = new DigitalSignatureService();
export default digitalSignature;

