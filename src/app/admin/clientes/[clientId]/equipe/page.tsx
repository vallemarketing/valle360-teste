'use client'

/**
 * Valle 360 - Gestão de Equipe do Cliente
 * Super Admin pode adicionar/remover colaboradores da equipe de um cliente
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Plus, Search, X, Check, Trash2,
  Mail, Phone, Briefcase, UserPlus, Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TeamMember {
  id: string
  employee_id: string
  employee_name: string
  employee_email: string
  employee_avatar?: string
  role: string
  assigned_at: string
  is_active: boolean
}

interface AvailableEmployee {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  department?: string
  area_of_expertise?: string
}

interface ClientInfo {
  id: string
  company_name: string
  contact_name: string
}

const ROLE_OPTIONS = [
  { value: 'account_manager', label: 'Gerente de Conta' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'designer', label: 'Designer' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'trafego', label: 'Gestor de Tráfego' },
  { value: 'video_maker', label: 'Video Maker' },
  { value: 'support', label: 'Suporte' },
]

export default function ClientTeamManagementPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('support')

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar informações do cliente
      const { data: client } = await supabase
        .from('clients')
        .select('id, company_name, contact_name')
        .eq('id', clientId)
        .single()

      if (client) {
        setClientInfo(client)
      }

      // Carregar equipe atual via API
      const response = await fetch(`/api/admin/clients/${clientId}/team`)
      const data = await response.json()

      if (data.success) {
        setTeamMembers(data.teamMembers || [])
      }

      // Carregar colaboradores disponíveis
      const { data: employees } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          department,
          area_of_expertise,
          user_profiles!inner (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('is_active', true)

      if (employees) {
        const formatted = employees.map((emp: any) => ({
          id: emp.id,
          user_id: emp.user_id,
          full_name: emp.user_profiles?.full_name || 'Sem nome',
          email: emp.user_profiles?.email || '',
          avatar_url: emp.user_profiles?.avatar_url,
          department: emp.department,
          area_of_expertise: emp.area_of_expertise,
        }))
        setAvailableEmployees(formatted)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da equipe')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedEmployee) {
      toast.error('Selecione um colaborador')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployee,
          role: selectedRole,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Colaborador adicionado à equipe!')
        setShowAddModal(false)
        setSelectedEmployee(null)
        setSelectedRole('support')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao adicionar colaborador')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao adicionar colaborador')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (assignmentId: string, memberName: string) => {
    if (!confirm(`Remover ${memberName} da equipe deste cliente?`)) return

    try {
      const response = await fetch(`/api/admin/clients/${clientId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Colaborador removido da equipe')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao remover colaborador')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover colaborador')
    }
  }

  // Filtrar colaboradores disponíveis (que não estão na equipe)
  const filteredAvailable = availableEmployees.filter(emp => {
    const isAlreadyInTeam = teamMembers.some(tm => tm.employee_id === emp.id)
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    return !isAlreadyInTeam && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/clientes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Equipe do Cliente
              </h1>
              {clientInfo && (
                <p className="text-gray-500 dark:text-gray-400">
                  {clientInfo.company_name}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum membro na equipe
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  Adicione colaboradores para gerenciar este cliente
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.employee_avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.employee_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {member.employee_name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.employee_email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveMember(member.id, member.employee_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {ROLE_OPTIONS.find(r => r.value === member.role)?.label || member.role}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Desde {new Date(member.assigned_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Member Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Adicionar Membro à Equipe
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Modal Content */}
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Role Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Função na equipe
                    </label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee List */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredAvailable.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum colaborador disponível</p>
                      </div>
                    ) : (
                      filteredAvailable.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                            selectedEmployee === emp.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={emp.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {emp.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {emp.full_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {emp.area_of_expertise || emp.department || emp.email}
                            </p>
                          </div>
                          {selectedEmployee === emp.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t dark:border-gray-700">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    disabled={!selectedEmployee || saving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar à Equipe
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
