'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Mail, Phone, Award, Calendar, MoreVertical, X, TrendingUp, Target, Clock, Star, AlertTriangle, CheckCircle, ChevronRight, Sparkles, Copy, Edit, Trash2, Eye, Power, PowerOff, User, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CredentialsModal } from '@/components/admin/CredentialsModal'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Employee {
  id: string
  employeeId?: string
  fullName: string
  email: string
  phone: string
  position: string
  department: string
  areaOfExpertise: string
  status: 'active' | 'inactive' | 'vacation'
  hireDate: string
  avatar: string
  performanceScore: number
  // Dados adicionais para o modal
  deliveriesOnTime: number
  totalDeliveries: number
  retentionStatus: 'reter' | 'melhorar' | 'atenção'
  clientsAssigned: number
  feedbackHistory: Array<{
    date: string
    type: 'positive' | 'negative' | 'neutral'
    comment: string
  }>
}

export default function EmployeesListPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [creatingTestEmployees, setCreatingTestEmployees] = useState(false)
  const [testEmployees, setTestEmployees] = useState<{ email: string; password: string; type?: 'employee' | 'client' }[] | null>(null)
  const [testEmployeesWarnings, setTestEmployeesWarnings] = useState<{ email: string; warning: string }[] | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  
  // Estados para menu de ações
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState(false)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  
  // Estados para modal de credenciais
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [credenciaisInfo, setCredenciaisInfo] = useState<{
    email: string
    senha: string
    nome: string
    emailEnviado: boolean
    provider?: string
    mailtoUrl?: string
  } | null>(null)

  const handleViewDetails = (emp: Employee) => {
    setSelectedEmployee(emp)
    setShowModal(true)
  }
  
  const handleEditEmployee = (emp: Employee) => {
    router.push(`/admin/colaboradores/${emp.id}/editar`)
    setOpenMenuId(null)
  }
  
  const handleDeleteClick = (emp: Employee) => {
    setEmployeeToDelete(emp)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }
  
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return
    
    try {
      setDeletingEmployee(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`/api/admin/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao excluir colaborador')
      
      toast.success('Colaborador excluído com sucesso!')
      setShowDeleteModal(false)
      setEmployeeToDelete(null)
      await loadEmployeesReal()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir colaborador')
    } finally {
      setDeletingEmployee(false)
    }
  }
  
  const handleToggleStatus = async (emp: Employee) => {
    try {
      const newStatus = emp.status === 'active' ? 'inactive' : 'active'
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`/api/admin/employees/${emp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao atualizar status')
      
      toast.success(`Colaborador ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`)
      setOpenMenuId(null)
      await loadEmployeesReal()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao atualizar status')
    }
  }
  
  const handleResendWelcomeEmail = async (emp: Employee) => {
    try {
      setResendingEmail(emp.id)
      const authHeaders = await getAuthHeaders()
      const targetEmployeeId = emp.employeeId || emp.id
      const res = await fetch('/api/admin/resend-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ employeeId: targetEmployeeId, userId: emp.id, tipo: 'colaborador' }),
      })
      
      const data = await res.json().catch(() => null)
      
      if (data?.success) {
        toast.success(`Email enviado via ${data.provider || 'webhook'}!`)
        if (data.credentials) {
          setCredenciaisInfo({
            email: data.credentials.email,
            senha: data.credentials.senha,
            nome: emp.fullName,
            emailEnviado: true,
            provider: data.provider,
            mailtoUrl: data.mailtoUrl,
          })
          setShowCredentialsModal(true)
        }
      } else if (data?.fallbackMode) {
        toast.warning('Falha no envio automático. Use o botão mailto no modal.')
        setCredenciaisInfo({
          email: data.credentials.email,
          senha: data.credentials.senha,
          nome: emp.fullName,
          emailEnviado: false,
          mailtoUrl: data.mailtoUrl,
        })
        setShowCredentialsModal(true)
      } else {
        throw new Error(data?.error || 'Falha ao enviar email')
      }
      
      setOpenMenuId(null)
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reenviar email')
    } finally {
      setResendingEmail(null)
    }
  }

  // Lista real (via /api/admin/employees)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  const provisionTestEmployees = async () => {
    try {
      setCreatingTestEmployees(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/provision-test-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao criar colaboradores de teste')

      const password = String(data?.password || 'Valle@Teste2024')
      const creds = Array.isArray(data?.credentials) ? data.credentials : null
      const warnings = Array.isArray(data?.warnings) ? data.warnings : null
      setTestEmployeesWarnings(
        warnings?.map((w: any) => ({ email: String(w.email || ''), warning: String(w.warning || '') })) || null
      )
      if (creds && creds.length > 0) {
        setTestEmployees(
          creds.map((c: any) => ({
            email: String(c.email),
            password: String(c.password || password),
            type: c.type === 'client' ? 'client' : 'employee',
          }))
        )
      } else {
        const users = Array.isArray(data?.users) ? data.users : []
        setTestEmployees(users.map((u: any) => ({ email: String(u.email), password, type: 'employee' })))
      }

      await loadEmployeesReal()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar colaboradores de teste')
    } finally {
      setCreatingTestEmployees(false)
    }
  }

  const closeTestEmployeesModal = () => {
    setTestEmployees(null)
    setTestEmployeesWarnings(null)
    setCopiedKey(null)
  }

  const sortedTestEmployees = useMemo(() => {
    if (!testEmployees) return null
    const copy = [...testEmployees]
    copy.sort((a, b) => {
      const ta = a.type === 'client' ? 0 : 1
      const tb = b.type === 'client' ? 0 : 1
      if (ta !== tb) return ta - tb
      return a.email.localeCompare(b.email)
    })
    return copy
  }, [testEmployees])

  const safeCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200)
    } catch {
      // fallback: nada
    }
  }

  const loadEmployeesReal = async () => {
    try {
      setEmployeesLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/employees', { headers: authHeaders })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar colaboradores')
      setEmployees(Array.isArray(data?.employees) ? data.employees : [])
    } catch {
      setEmployees([])
    }
    finally {
      setEmployeesLoading(false)
    }
  }

  // Carrega dados reais uma vez
  useEffect(() => {
    loadEmployeesReal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRetentionBadge = (status: string) => {
    switch (status) {
      case 'reter':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Reter</Badge>
      case 'melhorar':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Melhorar</Badge>
      case 'atenção':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Atenção</Badge>
      default:
        return null
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment

    return matchesSearch && matchesDepartment
  })

  const getStatusInfo = (status: string) => {
    const statuses = {
      active: { bg: 'var(--success-50)', text: 'var(--success-700)', label: 'Ativo' },
      inactive: { bg: 'var(--error-50)', text: 'var(--error-700)', label: 'Inativo' },
      vacation: { bg: 'var(--warning-50)', text: 'var(--warning-700)', label: 'Férias' }
    }
    return statuses[status as keyof typeof statuses]
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'var(--success-500)'
    if (score >= 70) return 'var(--primary-500)'
    if (score >= 50) return 'var(--warning-500)'
    return 'var(--error-500)'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Colaboradores
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gerencie a equipe da Valle 360
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={provisionTestEmployees}
              disabled={creatingTestEmployees}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium border shadow-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)',
                opacity: creatingTestEmployees ? 0.7 : 1,
              }}
            >
              <Sparkles className="w-5 h-5" />
              {creatingTestEmployees ? 'Criando testes…' : 'Criar testes (Equipe + Cliente)'}
            </motion.button>
            <Link href="/admin/colaboradores/vincular">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium border shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              >
                Vincular existente
              </motion.button>
            </Link>
            <Link href="/admin/colaboradores/novo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white shadow-md"
                style={{ backgroundColor: 'var(--primary-500)' }}
              >
                <Plus className="w-5 h-5" />
                Novo Colaborador
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Modal de credenciais dos testes */}
        <AnimatePresence>
          {sortedTestEmployees && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={closeTestEmployeesModal}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                >
                  {/* Header (sticky) */}
                  <div className="p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          Acessos de teste ({sortedTestEmployees.length})
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Use para testes provisórios. Depois vocês podem excluir.
                        </p>
                      </div>
                      <button
                        onClick={closeTestEmployeesModal}
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        aria-label="Fechar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Senha padrão: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>Valle@Teste2024</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const txt = sortedTestEmployees
                              .map((t) => `${t.type === 'client' ? 'Cliente' : 'Colaborador'}\nEmail: ${t.email}\nSenha: ${t.password}`)
                              .join('\n\n')
                            safeCopy(txt, 'all')
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedKey === 'all' ? 'Copiado!' : 'Copiar tudo'}
                        </Button>
                        <Button onClick={closeTestEmployeesModal}>Fechar</Button>
                      </div>
                    </div>

                    {testEmployeesWarnings && testEmployeesWarnings.length > 0 && (
                      <div
                        className="mt-3 rounded-xl border p-3 text-xs"
                        style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      >
                        <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Avisos
                        </div>
                        <div className="max-h-20 overflow-y-auto space-y-1 pr-1">
                          {testEmployeesWarnings.map((w) => (
                            <div key={`${w.email}:${w.warning}`} className="break-words">
                              <span className="font-mono">{w.email}</span>: {w.warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-6">
                    <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2">
                      {sortedTestEmployees.map((t) => {
                        const label = t.type === 'client' ? 'Cliente' : 'Colaborador'
                        const rowKey = `row:${t.email}`
                        return (
                          <div
                            key={t.email}
                            className="rounded-xl border p-3 sm:p-4"
                            style={{ borderColor: 'var(--border-light)' }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div
                                  className="mb-2 text-[11px] inline-flex items-center rounded-full border px-2 py-0.5"
                                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                                >
                                  {label}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Email</div>
                                    <div className="font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                                      {t.email}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Senha</div>
                                    <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                                      {t.password}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                className="shrink-0"
                                onClick={() => safeCopy(`${t.email}\n${t.password}`, rowKey)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                {copiedKey === rowKey ? 'Copiado!' : 'Copiar'}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6 shadow-sm border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total Colaboradores
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {filteredEmployees.length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-6 shadow-sm border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Ativos
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--success-600)' }}>
              {employees.filter(e => e.status === 'active').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-6 shadow-sm border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Performance Média
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary-500)' }}>
              {employees.length > 0
                ? `${Math.round(employees.reduce((sum, e) => sum + e.performanceScore, 0) / employees.length)}%`
                : '—'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-6 shadow-sm border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-light)'
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Departamentos
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--purple-500)' }}>
              {new Set(employees.map(e => e.department)).size}
            </p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">Todos os Departamentos</option>
            <option value="Marketing">Marketing</option>
            <option value="Design">Design</option>
            <option value="Comercial">Comercial</option>
            <option value="Financeiro">Financeiro</option>
            <option value="RH">RH</option>
          </select>
        </div>

        {/* Employees List */}
        <div className="space-y-4">
          {filteredEmployees.map((employee, index) => {
            const statusInfo = getStatusInfo(employee.status)
            return (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl p-6 shadow-sm border hover:shadow-md transition-all"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={employee.avatar}
                      alt={employee.fullName}
                      className="w-16 h-16 rounded-full"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                          {employee.fullName}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {employee.position} • {employee.department}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                          <Mail className="w-4 h-4" />
                          <span className="truncate" title={employee.email}>{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                          <Phone className="w-4 h-4" />
                          <span className="truncate" title={employee.phone}>{employee.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0" style={{ color: 'var(--text-secondary)' }}>
                          <Calendar className="w-4 h-4" />
                          <span className="truncate" title={new Date(employee.hireDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}>
                            Desde {new Date(employee.hireDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Performance Score */}
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-4"
                        style={{
                          borderColor: getPerformanceColor(employee.performanceScore),
                          color: getPerformanceColor(employee.performanceScore)
                        }}
                      >
                        {employee.performanceScore}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Performance
                      </p>
                    </div>

                    <motion.button
                      onClick={() => handleViewDetails(employee)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                      style={{
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-600)'
                      }}
                    >
                      Ver Detalhes
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    {/* Menu de Ações */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === employee.id ? null : employee.id)
                        }}
                        className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <MoreVertical className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {openMenuId === employee.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-12 z-50 w-56 rounded-xl shadow-xl border overflow-hidden"
                            style={{ 
                              backgroundColor: 'var(--bg-primary)',
                              borderColor: 'var(--border-primary)'
                            }}
                          >
                            <div className="py-2">
                              {/* Ver Detalhes */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDetails(employee)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-blue-500" />
                                <span style={{ color: 'var(--text-primary)' }}>Ver Detalhes</span>
                              </button>
                              
                              {/* Editar */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditEmployee(employee)
                                }}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Edit className="w-4 h-4 text-amber-500" />
                                <span style={{ color: 'var(--text-primary)' }}>Editar Colaborador</span>
                              </button>
                              
                              {/* Reenviar Email */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResendWelcomeEmail(employee)
                                }}
                                disabled={resendingEmail === employee.id}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                              >
                                {resendingEmail === employee.id ? (
                                  <RefreshCw className="w-4 h-4 text-green-500 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4 text-green-500" />
                                )}
                                <span style={{ color: 'var(--text-primary)' }}>
                                  {resendingEmail === employee.id ? 'Enviando...' : 'Reenviar Credenciais'}
                                </span>
                              </button>
                              
                              <div className="my-2 border-t" style={{ borderColor: 'var(--border-primary)' }} />
                              
                              {/* Ativar/Desativar */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleStatus(employee)
                                }}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                {employee.status === 'active' ? (
                                  <>
                                    <PowerOff className="w-4 h-4 text-orange-500" />
                                    <span style={{ color: 'var(--text-primary)' }}>Desativar Colaborador</span>
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-4 h-4 text-green-500" />
                                    <span style={{ color: 'var(--text-primary)' }}>Ativar Colaborador</span>
                                  </>
                                )}
                              </button>
                              
                              {/* Excluir */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(employee)
                                }}
                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Excluir Colaborador</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {employeesLoading ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Carregando colaboradores...
            </p>
          </div>
        ) : filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Nenhum colaborador encontrado
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Colaborador */}
      <AnimatePresence>
        {showModal && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0a0f1a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.fullName}
                      className="w-16 h-16 rounded-full border-4 border-[#1672d6]/30"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-[#001533] dark:text-white">{selectedEmployee.fullName}</h2>
                      <p className="text-gray-500">{selectedEmployee.position}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedEmployee.department}</Badge>
                        {getRetentionBadge(selectedEmployee.retentionStatus)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Performance Score */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#1672d6]/10 to-[#001533]/5 border border-[#1672d6]/20">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#1672d6]" />
                    Performance Geral
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4",
                      selectedEmployee.performanceScore >= 90 ? "border-emerald-500 text-emerald-500" :
                      selectedEmployee.performanceScore >= 70 ? "border-[#1672d6] text-[#1672d6]" :
                      selectedEmployee.performanceScore >= 50 ? "border-amber-500 text-amber-500" : "border-red-500 text-red-500"
                    )}>
                      {selectedEmployee.performanceScore}%
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Entregas no Prazo</span>
                          <span className="font-medium">{selectedEmployee.deliveriesOnTime}/{selectedEmployee.totalDeliveries}</span>
                        </div>
                        <Progress value={(selectedEmployee.deliveriesOnTime / selectedEmployee.totalDeliveries) * 100} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 rounded-lg bg-white dark:bg-[#001533]/50">
                          <p className="text-2xl font-bold text-[#1672d6]">{selectedEmployee.clientsAssigned}</p>
                          <p className="text-xs text-gray-500">Clientes Atribuídos</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-white dark:bg-[#001533]/50">
                          <p className="text-2xl font-bold text-emerald-500">{Math.round((selectedEmployee.deliveriesOnTime / selectedEmployee.totalDeliveries) * 100)}%</p>
                          <p className="text-xs text-gray-500">Taxa de Entrega</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#001533]/30">
                    <Mail className="w-4 h-4 text-[#1672d6]" />
                    <div>
                      <p className="text-xs text-gray-500">E-mail</p>
                      <p className="text-sm font-medium">{selectedEmployee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#001533]/30">
                    <Phone className="w-4 h-4 text-[#1672d6]" />
                    <div>
                      <p className="text-xs text-gray-500">Telefone</p>
                      <p className="text-sm font-medium">{selectedEmployee.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Histórico de Feedbacks */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Histórico de Feedbacks
                  </h3>
                  <div className="space-y-2">
                    {selectedEmployee.feedbackHistory.map((feedback, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border-l-4",
                          feedback.type === 'positive' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" :
                          feedback.type === 'negative' ? "border-red-500 bg-red-50 dark:bg-red-900/10" :
                          "border-gray-300 bg-gray-50 dark:bg-gray-900/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {new Date(feedback.date).toLocaleDateString('pt-BR')}
                          </span>
                          {feedback.type === 'positive' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {feedback.type === 'negative' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button className="flex-1 bg-[#1672d6] hover:bg-[#1260b5]">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Performance Completa
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && employeeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => {
              if (!deletingEmployee) {
                setShowDeleteModal(false)
                setEmployeeToDelete(null)
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Excluir Colaborador
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <p style={{ color: 'var(--text-secondary)' }}>
                  Tem certeza que deseja excluir o colaborador{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{employeeToDelete.fullName}</strong>?
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Todos os dados associados a este colaborador serão removidos permanentemente, incluindo:
                </p>
                <ul className="mt-2 text-sm space-y-1" style={{ color: 'var(--text-tertiary)' }}>
                  <li>• Histórico de tarefas no Kanban</li>
                  <li>• Mensagens e conversas</li>
                  <li>• Atribuições de clientes</li>
                  <li>• Registro de performance</li>
                </ul>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--border-primary)' }}>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setEmployeeToDelete(null)
                  }}
                  disabled={deletingEmployee}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteEmployee}
                  disabled={deletingEmployee}
                >
                  {deletingEmployee ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Colaborador
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay para fechar menus ao clicar fora */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
      
      {/* Modal de Credenciais */}
      {credenciaisInfo && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false)
            setCredenciaisInfo(null)
          }}
          credentials={{
            email: credenciaisInfo.email,
            senha: credenciaisInfo.senha,
            webmailUrl: 'https://webmail.vallegroup.com.br/',
            loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
            mailtoUrl: credenciaisInfo.mailtoUrl,
          }}
          nome={credenciaisInfo.nome}
          tipo="colaborador"
          emailEnviado={credenciaisInfo.emailEnviado}
          provider={credenciaisInfo.provider}
        />
      )}
    </div>
  )
}
