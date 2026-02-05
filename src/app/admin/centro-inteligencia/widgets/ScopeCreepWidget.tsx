'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AlertTriangle, CheckCircle2, AlertOctagon, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ScopeItem {
  client_name: string
  service_name: string
  deliverable_type: string
  contracted_qty: number
  produced_qty: number
  excess_qty: number
  status: 'critical' | 'warning' | 'normal'
}

export default function ScopeCreepWidget() {
  const [items, setItems] = useState<ScopeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      // Em produção, 'view_scope_creep' deve existir. 
      // Se não existir, o supabase retorna erro, trataremos com array vazio.
      const { data, error } = await supabase
        .from('view_scope_creep')
        .select('*')
        .in('status', ['critical', 'warning'])
        .limit(5)
      
      if (error) {
        console.error('Erro ao carregar scope creep:', error)
      } else {
        setItems(data || [])
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  if (isLoading) return <div className="h-full flex items-center justify-center min-h-[200px]">Carregando...</div>

  return (
    <Card className="border-l-4 border-l-red-500 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-gray-900">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            Detector de Scope Creep
          </div>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {items.length} alertas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Clientes solicitando mais entregas do que o contratado.
        </p>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>Nenhum desvio de escopo detectado.</p>
            </div>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border hover:shadow-sm transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{item.client_name}</p>
                    {item.status === 'critical' && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.service_name} • <span className="capitalize">{item.deliverable_type}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {item.produced_qty} <span className="text-gray-400 text-xs font-normal">/ {item.contracted_qty}</span>
                    </p>
                    <p className="text-xs font-medium text-red-600">+{item.excess_qty} extra</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

