'use client'

import { Suspense, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  List,
  LayoutGrid,
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
  MoreVertical,
  Eye,
  BarChart2,
  TrendingUp,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewTaskForm } from '@/components/kanban/NewTaskForm'
import { CardModal } from '@/components/kanban/CardModal'
import { availableAreas, columnsByArea } from '@/lib/kanban/columnsByArea'
import type { DbTaskPriority, DbTaskStatus, KanbanCard } from '@/lib/kanban/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import ProfitabilityView from '@/components/dashboards/widgets/ProfitabilityView'
import { fetchProfilesMapByAuthIds } from '@/lib/messaging/userProfiles'

interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
}

function mapStatusForDb(status: string): DbTaskStatus {
  if (status === 'review') return 'in_review'
  if (status === 'in_review') return 'in_review'
  if (status === 'todo') return 'todo'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'done') return 'done'
  if (status === 'backlog') return 'backlog'
  if (status === 'blocked') return 'blocked'
  if (status === 'cancelled') return 'cancelled'
  return 'todo'
}

function mapPriorityForDb(priority: string): DbTaskPriority {
  if (priority === 'normal') return 'medium'
  if (priority === 'medium') return 'medium'
  if (priority === 'low') return 'low'
  if (priority === 'high') return 'high'
  if (priority === 'urgent') return 'urgent'
  return 'medium'
}

function AdminKanbanContent() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const deeplinkBoardId = searchParams.get('boardId')
  const deeplinkTaskId = searchParams.get('taskId')
  const [boardId, setBoardId] = useState<string | null>(null)
  const [columnIdByStatus, setColumnIdByStatus] = useState<Partial<Record<DbTaskStatus, string>>>({})
  const [loading, setLoading] = useState(true)
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'todo', title: 'A Fazer', color: '#F59E0B', cards: [] },
    { id: 'in_progress', title: 'Em Progresso', color: '#3B82F6', cards: [] },
    { id: 'in_review', title: 'Revisão', color: '#8B5CF6', cards: [] },
    { id: 'done', title: 'Concluído', color: '#10B981', cards: [] }
  ])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [userArea, setUserArea] = useState('Admin')
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    delayed: 0,
    completedToday: 0,
    productivity: 0
  })

  useEffect(() => {
    loadTasks(deeplinkBoardId, deeplinkTaskId)
  }, [deeplinkBoardId, deeplinkTaskId])

  const ensureBoardAndColumns = async (preferredBoardId?: string | null) => {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id
    if (!userId) throw new Error('Não autenticado')

    // Board "Super Admin" (client_id null)
    let { data: superBoard } = await supabase
      .from('kanban_boards')
      .select('id, name')
      .is('client_id', null)
      .eq('name', 'Super Admin')
      .limit(1)
      .maybeSingle()

    if (!superBoard) {
      const { data: created, error } = await supabase
        .from('kanban_boards')
        .insert({
          name: 'Super Admin',
          description: 'Quadro central do Admin',
          client_id: null,
          is_active: true,
          created_by: userId
        })
        .select('id, name')
        .single()
      if (error) throw error
      superBoard = created
    }

    let board = superBoard
    if (preferredBoardId) {
      const { data: preferred } = await supabase
        .from('kanban_boards')
        .select('id, name')
        .eq('id', preferredBoardId)
        .maybeSingle()

      if (preferred?.id) {
        board = preferred
      }
    }

    // Columns do board
    let { data: cols } = await supabase
      .from('kanban_columns')
      .select('id, name, position, color')
      .eq('board_id', board.id)
      .order('position', { ascending: true })

    if (!cols || cols.length === 0) {
      const defaults = [
        { name: 'Backlog', position: 1, color: '#64748b' },
        { name: 'A Fazer', position: 2, color: '#f59e0b' },
        { name: 'Em Progresso', position: 3, color: '#3b82f6' },
        { name: 'Em Revisão', position: 4, color: '#8b5cf6' },
        { name: 'Concluído', position: 5, color: '#22c55e' },
        { name: 'Bloqueado', position: 6, color: '#ef4444' },
        { name: 'Cancelado', position: 7, color: '#9ca3af' }
      ]

      const { error: insErr } = await supabase
        .from('kanban_columns')
        .insert(defaults.map((c) => ({ ...c, board_id: board!.id })))
      if (insErr) throw insErr

      const reload = await supabase
        .from('kanban_columns')
        .select('id, name, position, color')
        .eq('board_id', board.id)
        .order('position', { ascending: true })
      cols = reload.data || []
    }

    const nameToId: Record<string, string> = {}
    ;(cols || []).forEach((c: any) => {
      if (c?.name && c?.id) nameToId[String(c.name)] = String(c.id)
    })

    const fallbackColId = (cols || [])[0]?.id as string | undefined
    const map: Partial<Record<DbTaskStatus, string>> = {
      backlog: nameToId['Backlog'] || fallbackColId,
      todo: nameToId['A Fazer'] || fallbackColId,
      in_progress: nameToId['Em Progresso'] || fallbackColId,
      in_review: (nameToId['Em Revisão'] || nameToId['Revisão']) || fallbackColId,
      done: nameToId['Concluído'] || fallbackColId,
      blocked: nameToId['Bloqueado'] || fallbackColId,
      cancelled: nameToId['Cancelado'] || fallbackColId
    }

    setBoardId(board.id)
    setColumnIdByStatus(map)
    return { boardId: board.id as string, columnIdByStatus: map, userId }
  }

  const loadTasks = async (preferredBoardId?: string | null, preferredTaskId?: string | null) => {
    try {
      const init = await ensureBoardAndColumns(preferredBoardId)
      const { data: tasks, error } = await supabase
        .from('kanban_tasks')
        .select('*')
        .eq('board_id', init.boardId)
        .order('created_at', { ascending: false })
        .limit(250)

      if (error) throw error

      // Resolver nomes de responsáveis (assigned_to)
      const assignedIds = Array.from(
        new Set((tasks || []).map((t: any) => t.assigned_to).filter(Boolean))
      ) as string[]

      const assignedNameById: Record<string, string> = {}
      if (assignedIds.length > 0) {
        const profilesMap = await fetchProfilesMapByAuthIds(supabase as any, assignedIds)
        assignedIds.forEach((uid) => {
          const p = profilesMap.get(uid)
          assignedNameById[uid] = p?.full_name || p?.email || uid
        })
      }

      const cardById: Record<string, KanbanCard> = {}
      const cards = (tasks || []).map((task: any) => {
        const card: KanbanCard = {
          id: task.id,
          title: task.title,
          description: task.description || '',
          priority: mapPriorityForDb(task.priority || 'medium'),
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          assignees: task.assigned_to ? [assignedNameById[task.assigned_to] || task.assigned_to] : [],
          tags: task.tags || [],
          comments: 0,
          attachments: Array.isArray(task.attachment_urls) ? task.attachment_urls.length : (task.attachments ? 1 : 0),
          column: mapStatusForDb(task.status),
          area: task.area || '',
          createdAt: task.created_at ? new Date(task.created_at) : new Date(),
          boardId: task.board_id,
          clientId: task.client_id
        }
        cardById[card.id] = card
        return card
      })

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: cards.filter((c) => c.column === col.id),
        }))
      )

      if (preferredTaskId && cardById[preferredTaskId]) {
        setSelectedCard(cardById[preferredTaskId])
        setShowCardModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const newColumns = [...columns]
    const sourceCards = [...sourceColumn.cards]
    const destCards = source.droppableId === destination.droppableId ? sourceCards : [...destColumn.cards]

    const [movedCard] = sourceCards.splice(source.index, 1)
    movedCard.column = mapStatusForDb(destination.droppableId)
    destCards.splice(destination.index, 0, movedCard)

    const sourceIndex = newColumns.findIndex(col => col.id === source.droppableId)
    const destIndex = newColumns.findIndex(col => col.id === destination.droppableId)

    newColumns[sourceIndex] = { ...sourceColumn, cards: sourceCards }
    if (source.droppableId !== destination.droppableId) {
      newColumns[destIndex] = { ...destColumn, cards: destCards }
    }

    setColumns(newColumns)

    // Atualizar no banco
    try {
      const targetColumnId =
        columnIdByStatus[movedCard.column] || columnIdByStatus.todo

      if (!boardId || !targetColumnId) {
        throw new Error('Board/colunas do Kanban não inicializados')
      }

      // Renumerar posições (source + destination) para manter ordenação consistente
      const updates: Array<{ id: string; position: number; column_id: string; status: DbTaskStatus }> = []

      const renumber = (col: KanbanColumn) => {
        const colId = columnIdByStatus[(col.id as DbTaskStatus)] || columnIdByStatus.todo
        ;(col.cards || []).forEach((c, idx) => {
          updates.push({
            id: c.id,
            position: idx + 1,
            column_id: colId as string,
            status: c.column
          })
        })
      }

      renumber(newColumns[sourceIndex])
      if (sourceIndex !== destIndex) renumber(newColumns[destIndex])

      for (const u of updates) {
      await supabase
        .from('kanban_tasks')
          .update({
            status: u.status,
            column_id: u.column_id,
            position: u.position,
            updated_at: new Date().toISOString()
          })
          .eq('id', u.id)
          .eq('board_id', boardId)
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const handleNewTask = async (taskData: any) => {
    try {
      const init =
        boardId && Object.keys(columnIdByStatus || {}).length > 0
          ? { boardId, columnIdByStatus }
          : await ensureBoardAndColumns(deeplinkBoardId)

      // Mapear coluna do formulário (pode vir como 'review' / 'briefing' etc) para status do DB
      const rawColumn = taskData.column || 'todo'
      const normalized =
        rawColumn === 'review' ? 'in_review' :
        rawColumn === 'done' || rawColumn === 'concluido' || rawColumn === 'concluído' ? 'done' :
        rawColumn === 'in_progress' || rawColumn === 'em_execucao' || rawColumn === 'em_criacao' ? 'in_progress' :
        rawColumn === 'backlog' || rawColumn === 'briefing' ? 'backlog' :
        'todo'

      const status = mapStatusForDb(normalized)
      const priority = mapPriorityForDb(taskData.priority)

      const links = typeof taskData.referenceLinks === 'string'
        ? taskData.referenceLinks
            .split(/[\n,; ]+/g)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

      const clientHint = typeof taskData.client === 'string' ? taskData.client.trim() : ''
      const baseDesc = (taskData.description || '').toString()
      const description =
        clientHint ? `Cliente: ${clientHint}\n\n${baseDesc}`.trim() : baseDesc || null

      const columnId =
        (init.columnIdByStatus as any)?.[status] ||
        (init.columnIdByStatus as any)?.todo

      if (!columnId) throw new Error('Coluna alvo não encontrada no board')

      const { data: last } = await supabase
        .from('kanban_tasks')
        .select('position')
        .eq('board_id', init.boardId)
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

      const position = Number(last?.position || 0) + 1

      const { data, error } = await supabase
        .from('kanban_tasks')
        .insert({
          board_id: init.boardId,
          column_id: columnId,
          title: taskData.title,
          description,
          priority,
          status,
          due_date: taskData.dueDate,
          area: taskData.area,
          tags: taskData.tags,
          // Compat: salvar referências em jsonb
          reference_links: links.length ? { links, raw: taskData.referenceLinks } : null,
          drive_link: taskData.driveLink,
          estimated_hours: taskData.estimatedHours ? Number(taskData.estimatedHours) : null,
          position
        })
        .select()

      if (error) throw error

      loadTasks()
      setShowNewTaskForm(false)
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      toast.error('Erro ao criar tarefa')
    }
  }

  const handleOpenCard = (card: KanbanCard) => {
    setSelectedCard(card)
    setShowCardModal(true)
  }

  const handleSaveCard = async (updatedCard: KanbanCard) => {
    try {
      const init =
        boardId && Object.keys(columnIdByStatus || {}).length > 0
          ? { boardId, columnIdByStatus }
          : await ensureBoardAndColumns()

      const status = mapStatusForDb(updatedCard.column)
      const colId =
        (init.columnIdByStatus as any)?.[status] ||
        (init.columnIdByStatus as any)?.todo

      if (!colId) throw new Error('Coluna alvo não encontrada no board')

      const { data: last } = await supabase
        .from('kanban_tasks')
        .select('position')
        .eq('board_id', init.boardId)
        .eq('column_id', colId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

      const position = Number(last?.position || 0) + 1

      await supabase
        .from('kanban_tasks')
        .update({
          title: updatedCard.title,
          description: updatedCard.description,
          priority: updatedCard.priority,
          due_date: updatedCard.dueDate,
          tags: updatedCard.tags,
          status,
          column_id: colId,
          position,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCard.id)

      loadTasks()
      setShowCardModal(false)
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return

    try {
      await supabase
        .from('kanban_tasks')
        .delete()
        .eq('id', cardId)

      loadTasks()
      setShowCardModal(false)
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
    }
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    cards: column.cards.filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesArea = selectedArea === 'all' || card.area === selectedArea
      return matchesSearch && matchesArea
    })
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Meu Kanban - Super Admin
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Gerencie tarefas de todas as áreas
            </p>
          </div>
          
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="px-4 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--primary-600)' }}
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Filtro por Área */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-light)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">Todas as Áreas</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'kanban' ? 'text-white' : ''
              )}
              style={{
                backgroundColor: viewMode === 'kanban' ? 'var(--primary-500)' : 'transparent',
                color: viewMode === 'kanban' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' ? 'text-white' : ''
              )}
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--primary-500)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text-secondary)'
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            <div className="flex gap-4 min-w-max pb-4">
              {filteredColumns.map((column) => (
                <Droppable droppableId={column.id} key={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-80 flex-shrink-0 flex flex-col rounded-3xl border backdrop-blur-xl shadow-sm"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(200, 200, 200, 0.3)'
                      }}
                    >
                      {/* Column Header */}
                      <div className="p-5 border-b" style={{ borderColor: 'rgba(200, 200, 200, 0.3)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
                            <h3 className="font-semibold text-gray-900">{column.title}</h3>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'rgba(100, 100, 100, 0.1)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {column.cards.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {column.cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleOpenCard(card)}
                            className={`
                              p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-all backdrop-blur-sm
                              ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-indigo-500 ring-opacity-50 z-50' : ''}
                            `}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.6)',
                              borderColor: 'rgba(200, 200, 200, 0.3)',
                              ...provided.draggableProps.style
                            }}
                          >
                                <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>
                                {card.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{card.description}</p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      'px-2 py-1 rounded text-xs font-medium',
                                      card.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                      card.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                      card.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    )}>
                                      {card.priority}
                                    </span>
                                    {card.area && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                        {card.area}
                                      </span>
                                    )}
                                  </div>
                                  {card.dueDate && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tarefa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Área</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Prioridade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {filteredColumns.flatMap(col => col.cards).map((card) => (
                  <tr
                    key={card.id}
                    onClick={() => handleOpenCard(card)}
                    className="border-t cursor-pointer hover:bg-opacity-50 transition-all"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{card.title}</p>
                      {card.description && (
                        <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{card.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        {card.area}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {filteredColumns.find(col => col.cards.includes(card))?.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        card.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        card.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        card.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {card.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {card.dueDate ? new Date(card.dueDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Task Form com seleção de área */}
      {showNewTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">Selecione a Área da Tarefa</h3>
              <select
                value={userArea}
                onChange={(e) => setUserArea(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              >
                {availableAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <NewTaskForm
              isOpen={true}
              onClose={() => setShowNewTaskForm(false)}
              onSave={handleNewTask}
              userArea={userArea}
            />
          </div>
        </div>
      )}

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={{
            id: selectedCard.id,
            title: selectedCard.title,
            description: selectedCard.description,
            column: selectedCard.column,
            priority: selectedCard.priority,
            assignees: selectedCard.assignees,
            tags: selectedCard.tags,
            dueDate: selectedCard.dueDate ? new Date(selectedCard.dueDate) : undefined,
            attachments: selectedCard.attachments,
            comments: selectedCard.comments,
            createdAt: selectedCard.createdAt,
            area: selectedCard.area
          }}
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          isSuperAdmin={true}
        />
      )}
    </div>
  )
}

export default function AdminKanbanPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#001533]/60 dark:text-white/60">Carregando…</div>}>
      <AdminKanbanContent />
    </Suspense>
  )
}
