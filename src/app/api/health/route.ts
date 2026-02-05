import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    memory: ServiceCheck;
    environment: ServiceCheck;
  };
}

interface ServiceCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
}

const startTime = Date.now();

export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: await checkDatabase(),
    memory: checkMemory(),
    environment: checkEnvironment()
  };

  const allPassed = Object.values(checks).every(c => c.status === 'pass');
  const anyFailed = Object.values(checks).some(c => c.status === 'fail');

  const health: HealthCheck = {
    status: anyFailed ? 'unhealthy' : allPassed ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  
  try {
    // Query simples para verificar conexão
    const { error } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) {
      return {
        status: 'fail',
        responseTime,
        message: `Database error: ${error.message}`
      };
    }

    // Warn se resposta muito lenta
    if (responseTime > 1000) {
      return {
        status: 'warn',
        responseTime,
        message: 'Database response slow'
      };
    }

    return {
      status: 'pass',
      responseTime
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `Database connection failed: ${(error as Error).message}`
    };
  }
}

function checkMemory(): ServiceCheck {
  // Em Node.js, podemos verificar uso de memória
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    if (usagePercent > 90) {
      return {
        status: 'fail',
        message: `Memory critical: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`
      };
    }

    if (usagePercent > 70) {
      return {
        status: 'warn',
        message: `Memory high: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`
      };
    }

    return {
      status: 'pass',
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`
    };
  }

  return { status: 'pass' };
}

function checkEnvironment(): ServiceCheck {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    return {
      status: 'fail',
      message: `Missing env vars: ${missing.join(', ')}`
    };
  }

  // Verificar variáveis opcionais mas importantes
  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY'
  ];

  const missingOptional = optionalEnvVars.filter(v => !process.env[v]);

  if (missingOptional.length > 0) {
    return {
      status: 'warn',
      message: `Missing optional env vars: ${missingOptional.join(', ')}`
    };
  }

  return { status: 'pass' };
}

// Endpoint de readiness (para Kubernetes/Load Balancers)
export async function HEAD() {
  try {
    const { error } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    if (error) {
      return new Response(null, { status: 503 });
    }

    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
