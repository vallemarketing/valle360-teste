'use client'

import { useEffect, useState } from 'react'
import { ColaboradorHeader } from '@/components/layout/ColaboradorHeader'
import { ColaboradorSidebar } from '@/components/layout/ColaboradorSidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { ValFloatingChat } from '@/components/val/ValFloatingChat'
import { GuidedTour } from '@/components/tour/GuidedTour'

export default function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [firstName, setFirstName] = useState('Colaborador')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const userId = data.user?.id
        if (!userId) return

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', userId)
          .maybeSingle()

        const name = String(profile?.full_name || data.user?.email?.split('@')[0] || 'Colaborador')
        const fn = name.split(' ')[0] || 'Colaborador'
        if (mounted) setFirstName(fn)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <ProtectedRoute 
      allowedRoles={[
        'employee',      // Role no banco de dados (users.role)
        'colaborador',   // Role normalizado no sistema
        'super_admin'    // Super admin também pode acessar
      ]}
    >
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a]">
        {/* Header com botão de menu mobile */}
        <ColaboradorHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <ColaboradorSidebar />
        </div>
        
        {/* Sidebar Mobile */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-white dark:bg-[#0a0f1a]">
            <ColaboradorSidebar variant="sheet" />
          </SheetContent>
        </Sheet>
        
        {/* Main Content - Responsivo */}
        <main className="lg:ml-64 pt-[73px] min-h-screen transition-all duration-300">
          <div className="p-4 lg:p-6">{children}</div>
        </main>

        {/* Val Floating Chat */}
        <ValFloatingChat userName={firstName} />

        {/* Tour Guiado - Primeira Visita */}
        <GuidedTour variant="employee" />
      </div>
    </ProtectedRoute>
  )
}
