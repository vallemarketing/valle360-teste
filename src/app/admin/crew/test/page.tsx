'use client';

/**
 * Página de Teste do CrewAI Robusto
 * Interface para testar todos os componentes implementados
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Zap, Users, Database, BarChart3, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  testType: string;
  result?: any;
  error?: string;
}

export default function CrewTestPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loadingTests, setLoadingTests] = useState<Record<string, boolean>>({});

  // Verificar status do sistema
  const checkSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/admin/crew/test/status');
      const data = await response.json();
      setSystemStatus(data);
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error('Erro ao verificar status');
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Executar teste
  const runTest = async (testType: string, params: any = {}) => {
    setLoadingTests(prev => ({ ...prev, [testType]: true }));
    
    try {
      const response = await fetch('/api/admin/crew/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType, params }),
      });
      
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [testType]: data,
      }));
      
      if (data.success) {
        toast.success(`✅ Teste ${testType} concluído!`);
      } else {
        toast.error(`❌ Teste ${testType} falhou: ${data.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro no teste: ${error.message}`);
      setTestResults(prev => ({
        ...prev,
        [testType]: { success: false, testType, error: error.message },
      }));
    } finally {
      setLoadingTests(prev => ({ ...prev, [testType]: false }));
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🚀 CrewAI Robusto - Testes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Teste todos os componentes do sistema implementado
            </p>
          </div>
          
          <Button
            onClick={checkSystemStatus}
            disabled={loadingStatus}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loadingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Verificar Status
              </>
            )}
          </Button>
        </div>

        {/* System Status */}
        {systemStatus && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-600" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(systemStatus.status || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center space-x-2">
                    {value === 'connected' || value === 'ready' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}: <span className="text-gray-600">{value}</span>
                    </span>
                  </div>
                ))}
              </div>
              {systemStatus.message && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {systemStatus.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Test 1: Enhanced Agent */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="mr-2 h-5 w-5 text-purple-600" />
                Enhanced Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Testa agente com reflexão, self-correction e circuit breaker
              </p>
              
              <Button
                onClick={() => runTest('enhanced_agent')}
                disabled={loadingTests.enhanced_agent}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loadingTests.enhanced_agent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Teste'
                )}
              </Button>
              
              {testResults.enhanced_agent && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                  {testResults.enhanced_agent.success ? (
                    <>
                      <p className="font-semibold text-green-600 mb-2">✅ Sucesso!</p>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong>Output:</strong> {testResults.enhanced_agent.result?.output?.substring(0, 150)}...
                      </p>
                      {testResults.enhanced_agent.result?.reflection && (
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Score:</strong> {testResults.enhanced_agent.result.reflection.score}/10 
                          ({testResults.enhanced_agent.result.reflection.confidence}% confiança)
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-red-600">❌ Erro: {testResults.enhanced_agent.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 2: Enhanced Crew */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5 text-blue-600" />
                Enhanced Crew
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Testa execução paralela com 3 agentes trabalhando simultaneamente
              </p>
              
              <Button
                onClick={() => runTest('enhanced_crew', { process: 'parallel' })}
                disabled={loadingTests.enhanced_crew}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loadingTests.enhanced_crew ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Teste'
                )}
              </Button>
              
              {testResults.enhanced_crew && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                  {testResults.enhanced_crew.success ? (
                    <>
                      <p className="font-semibold text-green-600 mb-2">✅ Sucesso!</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Tempo:</strong> {testResults.enhanced_crew.result?.totalTime}ms
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Tokens:</strong> {testResults.enhanced_crew.result?.totalTokens}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Tarefas:</strong> {testResults.enhanced_crew.result?.taskResults?.length}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600">❌ Erro: {testResults.enhanced_crew.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 3: Queue System */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Activity className="mr-2 h-5 w-5 text-green-600" />
                Queue System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Testa BullMQ com filas de prioridade e progress tracking
              </p>
              
              <Button
                onClick={() => runTest('queue_system')}
                disabled={loadingTests.queue_system}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loadingTests.queue_system ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Teste'
                )}
              </Button>
              
              {testResults.queue_system && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                  {testResults.queue_system.success ? (
                    <>
                      <p className="font-semibold text-green-600 mb-2">✅ Sucesso!</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Job ID:</strong> {testResults.queue_system.result?.jobId}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {testResults.queue_system.result?.message}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600">❌ Erro: {testResults.queue_system.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 4: Memory System */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Database className="mr-2 h-5 w-5 text-orange-600" />
                Memory System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Testa Redis (short-term), Supabase (mid-term) e pgvector (long-term)
              </p>
              
              <Button
                onClick={() => runTest('memory_system')}
                disabled={loadingTests.memory_system}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loadingTests.memory_system ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Teste'
                )}
              </Button>
              
              {testResults.memory_system && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                  {testResults.memory_system.success ? (
                    <>
                      <p className="font-semibold text-green-600 mb-2">✅ Sucesso!</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Redis:</strong> {testResults.memory_system.result?.shortTerm?.message}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Campaigns:</strong> {testResults.memory_system.result?.midTerm?.campaignsFound}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Learnings:</strong> {testResults.memory_system.result?.longTerm?.learningsFound}
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600">❌ Erro: {testResults.memory_system.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 5: Content Scorer */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="mr-2 h-5 w-5 text-pink-600" />
                Content Scorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Testa avaliação multi-dimensional de conteúdo (5 dimensões)
              </p>
              
              <Button
                onClick={() => runTest('content_scorer')}
                disabled={loadingTests.content_scorer}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {loadingTests.content_scorer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Executar Teste'
                )}
              </Button>
              
              {testResults.content_scorer && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                  {testResults.content_scorer.success ? (
                    <>
                      <p className="font-semibold text-green-600 mb-2">✅ Sucesso!</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Score Geral:</strong> {testResults.content_scorer.result?.score?.overall}/10
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Clareza:</strong> {testResults.content_scorer.result?.score?.clarity}/10
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Persuasão:</strong> {testResults.content_scorer.result?.score?.persuasion}/10
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Confiança:</strong> {testResults.content_scorer.result?.score?.confidence}%
                      </p>
                    </>
                  ) : (
                    <p className="text-red-600">❌ Erro: {testResults.content_scorer.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              📖 Como Usar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900 dark:text-blue-100">
            <p>
              <strong>1.</strong> Clique em "Verificar Status" para confirmar que todos os componentes estão operacionais
            </p>
            <p>
              <strong>2.</strong> Execute cada teste individualmente clicando no botão "Executar Teste"
            </p>
            <p>
              <strong>3.</strong> Observe os resultados e métricas de cada componente
            </p>
            <p className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <strong>⚠️ Nota:</strong> Para o Queue System funcionar, você precisa ter o Redis rodando. 
              Execute: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">redis-server</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
