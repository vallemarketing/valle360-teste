/**
 * PDF Report Generator
 * Generates white-label PDF reports for clients
 */

import { jsPDF } from 'jspdf';

interface ReportMetrics {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  followerGrowth: number;
}

interface TopPost {
  id: string;
  caption: string;
  platform: string;
  engagement: number;
  reach: number;
  publishedAt: string;
}

interface ReportData {
  clientName: string;
  clientLogo?: string;
  period: {
    start: string;
    end: string;
  };
  metrics: ReportMetrics;
  topPosts: TopPost[];
  platformBreakdown: Record<string, {
    posts: number;
    engagement: number;
    reach: number;
  }>;
}

interface WhiteLabelConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  companyName: string;
  reportFooter?: string;
}

export async function generateClientReport(
  data: ReportData,
  whiteLabelConfig?: WhiteLabelConfig
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = whiteLabelConfig?.primaryColor || '#4F46E5';
  const secondaryColor = whiteLabelConfig?.secondaryColor || '#6B7280';
  const companyName = whiteLabelConfig?.companyName || 'Valle360';

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to hex to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 79, g: 70, b: 229 };
  }

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  // === COVER PAGE ===
  
  // Header bar
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin, 38);

  // Report title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Social Media Performance Report', margin, 50);

  // Client name
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.clientName, margin, 90);

  // Period
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`, margin, 100);

  // Generated date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, margin, 108);

  // Big metrics cards
  let yPos = 130;
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 45;

  const mainMetrics = [
    { label: 'Posts Publicados', value: data.metrics.publishedPosts.toString() },
    { label: 'Taxa de Engajamento', value: `${data.metrics.engagementRate.toFixed(1)}%` },
    { label: 'Alcance Total', value: formatNumber(data.metrics.reach) },
  ];

  mainMetrics.forEach((metric, index) => {
    const xPos = margin + (index * (cardWidth + 5));
    
    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');
    
    // Value
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xPos + cardWidth / 2, yPos + 22, { align: 'center' });
    
    // Label
    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xPos + cardWidth / 2, yPos + 35, { align: 'center' });
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  const footerText = whiteLabelConfig?.reportFooter || `© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.`;
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' });

  // === PAGE 2: DETAILED METRICS ===
  doc.addPage();
  
  // Header
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Detalhadas', margin, 17);

  yPos = 40;

  // Section: Engagement Metrics
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Engajamento', margin, yPos);
  yPos += 10;

  const engagementMetrics = [
    { label: 'Curtidas', value: formatNumber(data.metrics.likes) },
    { label: 'Comentários', value: formatNumber(data.metrics.comments) },
    { label: 'Compartilhamentos', value: formatNumber(data.metrics.shares) },
    { label: 'Impressões', value: formatNumber(data.metrics.impressions) },
  ];

  const metricsPerRow = 2;
  const metricCardWidth = (contentWidth - 10) / metricsPerRow;
  const metricCardHeight = 35;

  engagementMetrics.forEach((metric, index) => {
    const row = Math.floor(index / metricsPerRow);
    const col = index % metricsPerRow;
    const xPos = margin + (col * (metricCardWidth + 10));
    const currentY = yPos + (row * (metricCardHeight + 5));

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos, currentY, metricCardWidth, metricCardHeight, 2, 2, 'F');

    doc.setTextColor(36, 36, 36);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xPos + 10, currentY + 18);

    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xPos + 10, currentY + 28);
  });

  yPos += Math.ceil(engagementMetrics.length / metricsPerRow) * (metricCardHeight + 5) + 15;

  // Section: Audience
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Audiência', margin, yPos);
  yPos += 10;

  const audienceMetrics = [
    { label: 'Seguidores', value: formatNumber(data.metrics.followers) },
    { label: 'Crescimento', value: `${data.metrics.followerGrowth >= 0 ? '+' : ''}${data.metrics.followerGrowth}%` },
  ];

  audienceMetrics.forEach((metric, index) => {
    const xPos = margin + (index * (metricCardWidth + 10));

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos, yPos, metricCardWidth, metricCardHeight, 2, 2, 'F');

    doc.setTextColor(36, 36, 36);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xPos + 10, yPos + 18);

    doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xPos + 10, yPos + 28);
  });

  yPos += metricCardHeight + 20;

  // Section: Platform Breakdown
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Desempenho por Plataforma', margin, yPos);
  yPos += 10;

  // Table header
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Plataforma', margin + 5, yPos + 7);
  doc.text('Posts', margin + 60, yPos + 7);
  doc.text('Engajamento', margin + 100, yPos + 7);
  doc.text('Alcance', margin + 145, yPos + 7);
  yPos += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  Object.entries(data.platformBreakdown).forEach(([platform, metrics], index) => {
    const bgColor = index % 2 === 0 ? 255 : 248;
    doc.setFillColor(bgColor, bgColor, bgColor);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    doc.setTextColor(36, 36, 36);
    doc.text(platform.charAt(0).toUpperCase() + platform.slice(1), margin + 5, yPos + 7);
    doc.text(metrics.posts.toString(), margin + 60, yPos + 7);
    doc.text(`${metrics.engagement.toFixed(1)}%`, margin + 100, yPos + 7);
    doc.text(formatNumber(metrics.reach), margin + 145, yPos + 7);
    yPos += 10;
  });

  // === PAGE 3: TOP POSTS ===
  if (data.topPosts.length > 0) {
    doc.addPage();
    
    // Header
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Posts do Período', margin, 17);

    yPos = 40;

    data.topPosts.slice(0, 5).forEach((post, index) => {
      // Post card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'F');

      // Rank number
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.circle(margin + 15, yPos + 15, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}`, margin + 15, yPos + 18, { align: 'center' });

      // Platform
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(post.platform.toUpperCase(), margin + 30, yPos + 12);

      // Caption (truncated)
      doc.setTextColor(36, 36, 36);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const truncatedCaption = post.caption.length > 80 ? post.caption.slice(0, 80) + '...' : post.caption;
      doc.text(truncatedCaption, margin + 30, yPos + 22);

      // Metrics
      doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      doc.setFontSize(8);
      doc.text(`Engajamento: ${post.engagement}% | Alcance: ${formatNumber(post.reach)} | ${formatDate(post.publishedAt)}`, margin + 30, yPos + 35);

      yPos += 50;
    });
  }

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.text(whiteLabelConfig?.reportFooter || `© ${new Date().getFullYear()} ${companyName}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc.output('blob');
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function emailReport(
  pdfBlob: Blob,
  recipientEmail: string,
  clientName: string
): Promise<void> {
  // Convert blob to base64 for email attachment
  const buffer = await pdfBlob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // Call email API
  await fetch('/api/email/send-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipientEmail,
      subject: `Relatório de Performance - ${clientName}`,
      attachments: [{
        filename: `relatorio-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        content: base64,
        contentType: 'application/pdf',
      }],
    }),
  });
}
