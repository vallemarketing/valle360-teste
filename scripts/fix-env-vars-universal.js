const fs = require('fs');
const path = require('path');

// 1. Definir caminhos
const rootEnvPath = path.resolve(__dirname, '../.env.local');
const valle360EnvPath = path.resolve(__dirname, '../valle-360/.env.local');

console.log('🔍 Procurando arquivos .env.local...');

// 2. Credenciais Corretas
const correctUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const correctKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!correctUrl || !correctKey) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente antes de rodar este script.');
  process.exit(1);
}

const envContent = `NEXT_PUBLIC_SUPABASE_URL=${correctUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${correctKey}
`;

// 3. Função para escrever
function writeEnv(targetPath) {
  try {
    // Se o diretório pai existir, escreve
    const dir = path.dirname(targetPath);
    if (fs.existsSync(dir)) {
      fs.writeFileSync(targetPath, envContent, 'utf8');
      try { fs.chmodSync(targetPath, '644'); } catch (e) {}
      console.log(`✅ .env.local atualizado em: ${targetPath}`);
    } else {
      console.log(`⚠️ Diretório não existe, pulando: ${dir}`);
    }
  } catch (e) {
    console.error(`❌ Erro ao escrever em ${targetPath}:`, e.message);
  }
}

// 4. Executar nos dois lugares possíveis
writeEnv(rootEnvPath);
writeEnv(valle360EnvPath);

console.log('🏁 Concluído.');

