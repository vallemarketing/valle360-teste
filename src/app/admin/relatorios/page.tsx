'use client';

import React from 'react';
import { ExecutiveReportGenerator } from '@/components/reports/ExecutiveReportGenerator';

export default function RelatoriosPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        <ExecutiveReportGenerator />
      </div>
    </div>
  );
}









