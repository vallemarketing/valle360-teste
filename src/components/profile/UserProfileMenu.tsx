'use client'

import * as React from 'react'
import { motion, Variants } from 'framer-motion'
import { 
  ChevronRight, 
  User, 
  Trophy, 
  Gift, 
  Target, 
  BarChart3, 
  Bell, 
  Settings, 
  MessageSquare, 
  LogOut, 
  Lightbulb, 
  FileText, 
  FolderOpen 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  isSeparator?: boolean
  badge?: number
}

interface UserProfile {
  name: string
  email: string
  avatarUrl: string
  role?: string
}

interface UserProfileMenuProps {
  user: UserProfile
  className?: string
}

const sidebarVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -15 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
}

export const UserProfileMenu = React.forwardRef<HTMLDivElement, UserProfileMenuProps>(
  ({ user, className }, ref) => {
    const router = useRouter()
    const [unreadNotifications, setUnreadNotifications] = React.useState(0)

    React.useEffect(() => {
      loadUnreadNotifications()
    }, [])

    const loadUnreadNotifications = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', authUser.id)
          .single()

        if (!employee) return

        // Contar notificações não lidas (mensagens motivacionais pendentes)
        const { data } = await supabase
          .from('employee_motivation_messages')
          .select('id', { count: 'exact', head: true })
          .eq('employee_id', employee.id)
          .eq('status', 'pending')

        setUnreadNotifications(data?.length || 0)
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
      }
    }

    const navItems: NavItem[] = [
      { 
        icon: <User className="w-4 h-4" />, 
        label: 'Editar Perfil', 
        href: '/colaborador/perfil' 
      },
      { 
        icon: <Trophy className="w-4 h-4" />, 
        label: 'Gamificação', 
        href: '/colaborador/gamificacao' 
      },
      { 
        icon: <BarChart3 className="w-4 h-4" />, 
        label: 'Meu Desempenho', 
        href: '/colaborador/desempenho' 
      },
      { 
        icon: <Bell className="w-4 h-4" />, 
        label: 'Notificações', 
        href: '/colaborador/notificacoes',
        badge: unreadNotifications 
      },
      { 
        isSeparator: true, 
        icon: null, 
        label: '', 
        href: '' 
      },
      { 
        icon: <FileText className="w-4 h-4" />, 
        label: 'Solicitações', 
        href: '/colaborador/solicitacoes' 
      },
      { 
        icon: <FolderOpen className="w-4 h-4" />, 
        label: 'Arquivos', 
        href: '/colaborador/arquivos' 
      },
      { 
        icon: <Settings className="w-4 h-4" />, 
        label: 'Configurações', 
        href: '/colaborador/configuracoes' 
      },
      { 
        isSeparator: true, 
        icon: null, 
        label: '', 
        href: '' 
      },
      { 
        icon: <MessageSquare className="w-4 h-4" />, 
        label: 'Suporte', 
        href: '/colaborador/suporte' 
      },
      { 
        icon: <Lightbulb className="w-4 h-4" />, 
        label: 'Me dê mais sugestões', 
        href: '/colaborador/sugestoes' 
      },
    ]

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'absolute top-16 left-4 z-50 flex w-full max-w-xs flex-col rounded-2xl border shadow-2xl',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-light)',
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={sidebarVariants}
        aria-label="Menu do Perfil"
      >
        {/* User Info Header */}
        <motion.div 
          variants={itemVariants} 
          className="flex items-center space-x-4 p-6"
          style={{
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={`Avatar de ${user.name}`}
              className="h-14 w-14 rounded-full object-cover ring-4"
              style={{ 
                // @ts-ignore
                '--tw-ring-color': 'var(--primary-100)' 
              }}
            />
            {/* Online indicator */}
            <div 
              className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2"
              style={{ 
                backgroundColor: 'var(--success-500)',
                borderColor: 'var(--bg-primary)'
              }}
            />
          </div>
          <div className="flex flex-col truncate flex-1">
            <span className="font-semibold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            <span className="text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
              {user.email}
            </span>
            {user.role && (
              <span 
                className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block w-fit"
                style={{ 
                  backgroundColor: 'var(--primary-50)', 
                  color: 'var(--primary-700)' 
                }}
              >
                {user.role}
              </span>
            )}
          </div>
        </motion.div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-3" role="navigation">
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.isSeparator ? (
                <motion.div 
                  variants={itemVariants} 
                  className="h-px my-2"
                  style={{ backgroundColor: 'var(--border-light)' }}
                />
              ) : (
                <motion.div variants={itemVariants}>
                  <Link
                    href={item.href}
                    className="group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all relative overflow-hidden"
                    style={{
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {/* Hover background */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'var(--primary-50)' }}
                    />
                    
                    <span 
                      className="mr-3 h-5 w-5 flex items-center justify-center relative z-10"
                      style={{ 
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <div className="group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                    </span>
                    
                    <span className="relative z-10 flex-1 group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                    
                    {item.badge ? (
                      <span 
                        className="relative z-10 ml-auto h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold"
                        style={{ 
                          backgroundColor: 'var(--error-500)', 
                          color: 'white' 
                        }}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 relative z-10" />
                    )}
                  </Link>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Logout Button */}
        <motion.div 
          variants={itemVariants} 
          className="p-3"
          style={{
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all relative overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'var(--error-50)' }}
            />
            
            <span 
              className="mr-3 h-5 w-5 relative z-10"
              style={{ color: 'var(--error-500)' }}
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </span>
            
            <span 
              className="relative z-10 group-hover:translate-x-1 transition-transform"
              style={{ color: 'var(--error-700)' }}
            >
              Sair
            </span>
          </button>
        </motion.div>
      </motion.div>
    )
  }
)

UserProfileMenu.displayName = 'UserProfileMenu'
