import { NextRequest, NextResponse } from 'next/server';
import {
  createBackup,
  listBackups,
  deleteBackup,
  exportData,
  exportTableAsCSV
} from '@/lib/backup';

export const dynamic = 'force-dynamic';

// GET - Listar backups ou exportar dados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Exportar tabela específica
    if (action === 'export-table') {
      const table = searchParams.get('table');
      if (!table) {
        return NextResponse.json(
          { error: 'Table name is required' },
          { status: 400 }
        );
      }
      
      const csv = await exportTableAsCSV(table);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${table}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    // Exportar dados completos
    if (action === 'export') {
      const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
      const tables = searchParams.get('tables')?.split(',');
      
      const data = await exportData({ format, tables });
      
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const extension = format;
      
      return new Response(data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="valle360_export_${new Date().toISOString().split('T')[0]}.${extension}"`
        }
      });
    }
    
    // Listar backups
    const backups = await listBackups();
    return NextResponse.json({ backups });
    
  } catch (error) {
    console.error('Error in backup GET:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - Criar backup
export async function POST() {
  try {
    const backup = await createBackup();
    return NextResponse.json({
      success: true,
      backup
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteBackup(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete backup' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}









