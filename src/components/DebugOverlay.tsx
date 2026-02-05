import React from 'react';

export const DebugOverlay = ({ data }: { data: any }) => {
  if (process.env.NODE_ENV === 'production') return null; // Só mostra se não for prod, ou comentar essa linha para forçar

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-xs max-w-md shadow-xl border border-green-900 pointer-events-none">
      <h3 className="font-bold mb-2 border-b border-gray-700 pb-1">🔧 DEBUG INFO (v2.1)</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};












