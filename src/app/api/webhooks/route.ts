import { NextRequest, NextResponse } from 'next/server';
import {
  createWebhookSubscription,
  listWebhookSubscriptions,
  deleteWebhookSubscription,
  updateWebhookSubscription,
  getEventLog,
  WebhookEventType
} from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

// GET - Listar webhooks e eventos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'events') {
      const limit = parseInt(searchParams.get('limit') || '100');
      const events = getEventLog(limit);
      return NextResponse.json({ events });
    }
    
    const subscriptions = listWebhookSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to list webhooks' },
      { status: 500 }
    );
  }
}

// POST - Criar webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, events } = body;
    
    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'URL and events array are required' },
        { status: 400 }
      );
    }
    
    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }
    
    const subscription = createWebhookSubscription(url, events as WebhookEventType[]);
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret, // Mostrar apenas na criação
        active: subscription.active,
        createdAt: subscription.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar webhook
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, url, events, active } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }
    
    const updated = updateWebhookSubscription(id, { url, events, active });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      subscription: updated
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = deleteWebhookSubscription(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}









