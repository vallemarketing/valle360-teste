/**
 * Valle 360 - Serviço de Exportação
 * Funções para exportar dados em Excel e PDF
 */

import { toast } from 'sonner';

// =====================================================
// TIPOS
// =====================================================

export interface ExportData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  metadata?: Record<string, string>;
}

export type ExportFormat = 'excel' | 'pdf' | 'csv';

// =====================================================
// FUNÇÕES DE EXPORTAÇÃO
// =====================================================

/**
 * Converte dados para CSV
 */
export function dataToCSV(data: ExportData): string {
  const lines: string[] = [];
  
  // Cabeçalho
  lines.push(data.headers.map(h => `"${h}"`).join(','));
  
  // Dados
  data.rows.forEach(row => {
    lines.push(row.map(cell => `"${cell}"`).join(','));
  });
  
  return lines.join('\n');
}

/**
 * Baixa arquivo CSV
 */
export function downloadCSV(data: ExportData, filename: string): void {
  const csv = dataToCSV(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success('📥 Arquivo CSV baixado com sucesso!');
}

/**
 * Exporta para Excel (XLSX) usando formato XML básico
 * Nota: Para produção, considere usar bibliotecas como xlsx ou exceljs
 */
export function exportToExcel(data: ExportData, filename: string): void {
  // Cria XML do Excel
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${data.title}">
    <Table>`;
  
  // Cabeçalhos
  xml += '<Row>';
  data.headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${escapeXML(header)}</Data></Cell>`;
  });
  xml += '</Row>';
  
  // Dados
  data.rows.forEach(row => {
    xml += '<Row>';
    row.forEach(cell => {
      const type = typeof cell === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXML(String(cell))}</Data></Cell>`;
    });
    xml += '</Row>';
  });
  
  xml += `</Table></Worksheet></Workbook>`;
  
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success('📊 Arquivo Excel baixado com sucesso!');
}

/**
 * Exporta para PDF usando a API de impressão do navegador
 * Cria uma tabela HTML formatada para impressão
 */
export function exportToPDF(data: ExportData, filename: string): void {
  // Abre uma nova janela para impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { padding: 20px; }
        h1 { color: #1672d6; font-size: 24px; margin-bottom: 10px; }
        .metadata { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1672d6; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        tr:hover { background: #f3f4f6; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 11px; text-align: center; }
        @media print {
          body { padding: 0; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      <h1>${data.title}</h1>
      <div class="metadata">
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        ${data.metadata ? Object.entries(data.metadata).map(([k, v]) => `<p>${k}: ${v}</p>`).join('') : ''}
      </div>
      <table>
        <thead>
          <tr>
            ${data.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Valle 360 © ${new Date().getFullYear()} - Relatório gerado automaticamente</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  toast.success('📄 Gerando PDF para impressão...');
}

/**
 * Função principal de exportação
 */
export function exportData(data: ExportData, filename: string, format: ExportFormat): void {
  switch (format) {
    case 'excel':
      exportToExcel(data, filename);
      break;
    case 'pdf':
      exportToPDF(data, filename);
      break;
    case 'csv':
      downloadCSV(data, filename);
      break;
    default:
      toast.error('Formato de exportação não suportado');
  }
}

/**
 * Escapa caracteres especiais XML
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =====================================================
// FUNÇÕES AUXILIARES PARA DADOS COMUNS
// =====================================================

/**
 * Formata número como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// =====================================================
// TEMPLATES DE EXPORTAÇÃO
// =====================================================

/**
 * Exporta relatório financeiro
 */
export function exportFinancialReport(
  transactions: Array<{
    date: string;
    description: string;
    client: string;
    value: number;
    status: string;
  }>,
  filename: string = 'relatorio-financeiro'
): void {
  const data: ExportData = {
    title: 'Relatório Financeiro',
    headers: ['Data', 'Descrição', 'Cliente', 'Valor', 'Status'],
    rows: transactions.map(t => [
      formatDate(t.date),
      t.description,
      t.client,
      formatCurrency(t.value),
      t.status
    ]),
    metadata: {
      'Total de Transações': String(transactions.length),
      'Valor Total': formatCurrency(transactions.reduce((sum, t) => sum + t.value, 0))
    }
  };
  
  // Pergunta ao usuário qual formato
  const format = window.confirm('Deseja exportar em Excel?\n(Clique em Cancelar para exportar em PDF)') 
    ? 'excel' 
    : 'pdf';
  
  exportData(data, filename, format as ExportFormat);
}

/**
 * Exporta lista de clientes
 */
export function exportClientsList(
  clients: Array<{
    name: string;
    email: string;
    phone?: string;
    status: string;
    contractValue?: number;
    startDate?: string;
  }>,
  filename: string = 'lista-clientes'
): void {
  const data: ExportData = {
    title: 'Lista de Clientes',
    headers: ['Nome', 'Email', 'Telefone', 'Status', 'Valor do Contrato', 'Data de Início'],
    rows: clients.map(c => [
      c.name,
      c.email,
      c.phone || '-',
      c.status,
      c.contractValue ? formatCurrency(c.contractValue) : '-',
      c.startDate ? formatDate(c.startDate) : '-'
    ]),
    metadata: {
      'Total de Clientes': String(clients.length)
    }
  };
  
  exportToExcel(data, filename);
}

/**
 * Exporta métricas de performance
 */
export function exportPerformanceMetrics(
  metrics: Array<{
    metric: string;
    current: number;
    previous: number;
    change: number;
    unit: string;
  }>,
  filename: string = 'metricas-performance'
): void {
  const data: ExportData = {
    title: 'Métricas de Performance',
    headers: ['Métrica', 'Atual', 'Anterior', 'Variação'],
    rows: metrics.map(m => [
      m.metric,
      `${m.current} ${m.unit}`,
      `${m.previous} ${m.unit}`,
      `${m.change > 0 ? '+' : ''}${m.change}%`
    ]),
    metadata: {
      'Período': 'Último mês'
    }
  };
  
  exportToPDF(data, filename);
}

/**
 * Exporta contratos
 */
export function exportContracts(
  contracts: Array<{
    number: string;
    client: string;
    value: number;
    startDate: string;
    endDate?: string;
    status: string;
  }>,
  filename: string = 'contratos'
): void {
  const data: ExportData = {
    title: 'Gestão de Contratos',
    headers: ['Número', 'Cliente', 'Valor', 'Início', 'Término', 'Status'],
    rows: contracts.map(c => [
      c.number,
      c.client,
      formatCurrency(c.value),
      formatDate(c.startDate),
      c.endDate ? formatDate(c.endDate) : 'Indeterminado',
      c.status
    ]),
    metadata: {
      'Total de Contratos': String(contracts.length),
      'Valor Total': formatCurrency(contracts.reduce((sum, c) => sum + c.value, 0))
    }
  };
  
  exportToExcel(data, filename);
}

