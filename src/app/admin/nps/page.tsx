'use client';

import React from 'react';
import { NPSDashboard } from '@/components/dashboard/NPSDashboard';

export default function NPSPage() {
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto">
        <NPSDashboard />
      </div>
    </div>
  );
}









