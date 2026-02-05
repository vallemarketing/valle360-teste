const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico e Correção de Ambiente');

const correctUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const correctKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!correctUrl || !correctKey) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}

const envContent = `NEXT_PUBLIC_SUPABASE_URL=${correctUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${correctKey}
`;

// Detectar raiz
let rootDir = __dirname;
if (rootDir.endsWith('scripts')) {
  rootDir = path.join(rootDir, '..');
}

const envPath = path.join(rootDir, '.env.local');
console.log('📍 Alvo:', envPath);

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  try { fs.chmodSync(envPath, '644'); } catch (e) {}
  console.log('✅ .env.local escrito com sucesso.');
  
  // Validar
  const current = fs.readFileSync(envPath, 'utf8');
  if (current.includes(correctUrl)) {
    console.log('✅ Validação OK: URL correta detectada.');
  } else {
    console.error('❌ Validação FALHOU.');
  }
} catch (err) {
  console.error('❌ Erro fatal:', err.message);
}

