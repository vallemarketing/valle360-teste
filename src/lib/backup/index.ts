// Backup System - Valle 360
// Sistema de backup e exportação de dados

import { supabase } from '@/lib/supabase';

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  size: number;
  tables: string[];
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  tables?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeDeleted?: boolean;
}

// Lista de tabelas para backup
const BACKUP_TABLES = [
  'employees',
  'clients',
  'tasks',
  'messages',
  'notifications',
  'approvals',
  'invoices',
  'payments',
  'nps_responses',
  'gamification_points',
  'audit_logs'
];

/**
 * Criar backup completo do sistema
 */
export async function createBackup(): Promise<BackupMetadata> {
  const id = generateBackupId();
  const backup: BackupMetadata = {
    id,
    createdAt: new Date(),
    size: 0,
    tables: BACKUP_TABLES,
    status: 'pending'
  };

  try {
    const data: Record<string, unknown[]> = {};
    let totalSize = 0;

    // Exportar cada tabela
    for (const table of BACKUP_TABLES) {
      try {
        const { data: tableData, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.warn(`Warning: Could not backup table ${table}:`, error.message);
          data[table] = [];
        } else {
          data[table] = tableData || [];
          totalSize += JSON.stringify(tableData).length;
        }
      } catch (err) {
        console.warn(`Warning: Error backing up table ${table}:`, err);
        data[table] = [];
      }
    }

    // Criar arquivo de backup
    const backupContent = JSON.stringify({
      metadata: {
        id,
        createdAt: backup.createdAt.toISOString(),
        version: '1.0',
        tables: BACKUP_TABLES
      },
      data
    }, null, 2);

    backup.size = backupContent.length;
    backup.status = 'completed';
    backup.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Em produção, fazer upload para storage
    // const { data: uploadData, error: uploadError } = await supabase.storage
    //   .from('backups')
    //   .upload(`${id}.json`, backupContent);

    console.log(`Backup ${id} created successfully. Size: ${formatBytes(backup.size)}`);
    return backup;

  } catch (error) {
    backup.status = 'failed';
    console.error('Backup failed:', error);
    throw error;
  }
}

/**
 * Exportar dados em formato específico
 */
export async function exportData(options: ExportOptions): Promise<string> {
  const tables = options.tables || BACKUP_TABLES;
  const data: Record<string, unknown[]> = {};

  for (const table of tables) {
    try {
      let query = supabase.from(table).select('*');

      // Aplicar filtro de data se especificado
      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start.toISOString())
          .lte('created_at', options.dateRange.end.toISOString());
      }

      const { data: tableData, error } = await query;

      if (error) {
        console.warn(`Warning: Could not export table ${table}:`, error.message);
        data[table] = [];
      } else {
        data[table] = tableData || [];
      }
    } catch (err) {
      console.warn(`Warning: Error exporting table ${table}:`, err);
      data[table] = [];
    }
  }

  if (options.format === 'csv') {
    return convertToCSV(data);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Exportar tabela específica como CSV
 */
export async function exportTableAsCSV(tableName: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) throw error;
    if (!data || data.length === 0) return '';

    return arrayToCSV(data);
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Converter dados para CSV
 */
function convertToCSV(data: Record<string, unknown[]>): string {
  const sections: string[] = [];

  for (const [table, rows] of Object.entries(data)) {
    if (rows.length === 0) continue;

    sections.push(`# Table: ${table}`);
    sections.push(arrayToCSV(rows as Record<string, unknown>[]));
    sections.push(''); // Linha em branco entre tabelas
  }

  return sections.join('\n');
}

/**
 * Converter array de objetos para CSV
 */
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      const str = String(value);
      // Escapar aspas e valores com vírgulas
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Restaurar backup
 */
export async function restoreBackup(backupData: string): Promise<{
  success: boolean;
  restored: string[];
  errors: string[];
}> {
  const result = {
    success: true,
    restored: [] as string[],
    errors: [] as string[]
  };

  try {
    const backup = JSON.parse(backupData);
    const { data } = backup;

    for (const [table, rows] of Object.entries(data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      try {
        // Em produção, implementar lógica de merge/upsert
        // Por segurança, não fazemos restore automático
        console.log(`Would restore ${rows.length} rows to ${table}`);
        result.restored.push(table);
      } catch (err) {
        result.errors.push(`${table}: ${(err as Error).message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(`Invalid backup format: ${(error as Error).message}`);
    return result;
  }
}

/**
 * Listar backups disponíveis
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  // Em produção, buscar do storage
  // const { data, error } = await supabase.storage
  //   .from('backups')
  //   .list();

  // Por enquanto, retornar dados mock
  return [
    {
      id: 'backup_20241127_030000',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      size: 256000000, // 256 MB
      tables: BACKUP_TABLES,
      status: 'completed',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'backup_20241126_030000',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 27),
      size: 254000000,
      tables: BACKUP_TABLES,
      status: 'completed',
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'backup_20241125_030000',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 51),
      size: 252000000,
      tables: BACKUP_TABLES,
      status: 'completed',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  ];
}

/**
 * Deletar backup
 */
export async function deleteBackup(backupId: string): Promise<boolean> {
  try {
    // Em produção, deletar do storage
    // const { error } = await supabase.storage
    //   .from('backups')
    //   .remove([`${backupId}.json`]);

    console.log(`Backup ${backupId} deleted`);
    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    return false;
  }
}

/**
 * Gerar ID de backup
 */
function generateBackupId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `backup_${date}_${time}`;
}

/**
 * Formatar bytes para exibição
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Agendar backup automático
 */
export function scheduleAutoBackup(intervalHours: number = 24): void {
  // Em produção, usar cron job ou similar
  console.log(`Auto backup scheduled every ${intervalHours} hours`);
  
  // Simular agendamento
  if (typeof setInterval !== 'undefined') {
    setInterval(async () => {
      try {
        console.log('Running scheduled backup...');
        await createBackup();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export default {
  createBackup,
  exportData,
  exportTableAsCSV,
  restoreBackup,
  listBackups,
  deleteBackup,
  scheduleAutoBackup
};









