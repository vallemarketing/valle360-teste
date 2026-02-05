export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  column: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignees: string[];
  tags: string[];
  dueDate?: Date;
  attachments: number;
  comments: number;
  createdAt: Date;
  area?: string;
  columnEnteredAt?: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  cards: KanbanCard[];
  wipLimit?: number;
}
