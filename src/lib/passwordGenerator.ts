/**
 * Gerador de senhas fortes para cPanel
 * Garante rating mínimo de 65/100 conforme requisitos do cPanel
 */

export function generateStrongPassword(length: number = 16): string {
  // Conjuntos de caracteres
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // sem l, o
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem I, O
  const numbers = '23456789'; // sem 0, 1
  const special = '!@#$%&*+=?';
  
  // Garantir pelo menos 1 de cada tipo (requisito do cPanel)
  let password = '';
  
  // 1 maiúscula
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  
  // 1 minúscula
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  
  // 2 números
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // 2 especiais
  password += special[Math.floor(Math.random() * special.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Preencher o restante aleatoriamente
  const allChars = lowercase + uppercase + numbers + special;
  const remaining = length - password.length;
  
  for (let i = 0; i < remaining; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar para não ter padrão óbvio
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Valida se a senha atende aos requisitos mínimos
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  rating: number;
  errors: string[];
} {
  const errors: string[] = [];
  let rating = 0;
  
  // Comprimento (mínimo 12)
  if (password.length < 12) {
    errors.push('Senha deve ter no mínimo 12 caracteres');
  } else {
    rating += 20;
  }
  
  // Maiúsculas
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter letras maiúsculas');
  } else {
    rating += 15;
  }
  
  // Minúsculas
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter letras minúsculas');
  } else {
    rating += 15;
  }
  
  // Números
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter números');
  } else {
    rating += 15;
  }
  
  // Caracteres especiais
  if (!/[!@#$%&*+=?]/.test(password)) {
    errors.push('Senha deve conter caracteres especiais (!@#$%&*+=?)');
  } else {
    rating += 20;
  }
  
  // Diversidade (mais pontos se tiver vários de cada)
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const specialCount = (password.match(/[!@#$%&*+=?]/g) || []).length;
  
  if (uppercaseCount >= 2 && lowercaseCount >= 2 && numberCount >= 2 && specialCount >= 2) {
    rating += 15;
  }
  
  const isValid = errors.length === 0 && rating >= 65;
  
  return {
    isValid,
    rating: Math.min(rating, 100),
    errors
  };
}

/**
 * Gera senha garantida para passar no cPanel
 */
export function generateCPanelPassword(): string {
  let password = generateStrongPassword(16);
  let validation = validatePasswordStrength(password);
  
  // Se por algum motivo não passar, tentar até 5 vezes
  let attempts = 0;
  while (!validation.isValid && attempts < 5) {
    password = generateStrongPassword(16);
    validation = validatePasswordStrength(password);
    attempts++;
  }
  
  return password;
}
