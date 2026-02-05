export type DbTaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'blocked'
  | 'cancelled'

export type DbTaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Tipo de card usado no Kanban (UI/Admin).
 * Mantém nomenclatura compatível com os componentes existentes (column/dueDate/createdAt etc).
 */
export interface KanbanCard {
  id: string
  title: string
  description?: string
  column: DbTaskStatus
  priority: DbTaskPriority
  assignees: string[]
  tags: string[]
  dueDate?: Date
  attachments: number
  comments: number
  createdAt: Date
  area?: string
  columnEnteredAt?: Date
  boardId?: string
  clientId?: string
}


