'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Palette, Shield, User, Camera, Save, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    messages: true,
    updates: false
  })

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto')
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    avatarUrl: '',
    phone: '',
    bio: ''
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserProfile({
          name: profile.full_name || '',
          email: user.email || '',
          avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}`,
          phone: profile.phone || '',
          bio: profile.bio || ''
        })
      }

      // Check 2FA status (mocked for now as it requires Supabase Enterprise or specific config)
      // const { data: { user: authUser } } = await supabase.auth.getUser()
      // setTwoFactorEnabled(authUser?.factors?.length > 0 || false)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública (assumindo bucket público 'avatars')
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = data.publicUrl

      // Atualizar perfil
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          await supabase
            .from('user_profiles')
            .update({ avatar_url: avatarUrl })
            .eq('user_id', user.id)
          
          setUserProfile(prev => ({ ...prev, avatarUrl }))
          toast.success('Foto de perfil atualizada!')
      }

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao atualizar foto: ' + error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const saveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: userProfile.name,
          phone: userProfile.phone,
          bio: userProfile.bio
        })
        .eq('user_id', user.id)

      if (error) {
        toast.error('Erro ao salvar perfil: ' + error.message)
      } else {
        toast.success('Perfil atualizado com sucesso!')
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    }
  }

  const toggle2FA = async () => {
      // Implementação real requereria endpoints de MFA do Supabase
      // Simulando toggle para UI
      setTwoFactorEnabled(!twoFactorEnabled)
      toast.success(twoFactorEnabled ? '2FA Desativado' : '2FA Ativado (Simulado)')
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Configurações
          </h1>
          <p className="text-gray-500">
            Personalize sua experiência e gerencie sua conta
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Profile */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Perfil
                </h2>
                <p className="text-sm text-gray-500">
                  Gerencie suas informações pessoais e foto
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm"
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div>
                  <p className="font-medium mb-1 text-gray-900">
                    Foto de perfil
                  </p>
                  <p className="text-sm mb-3 text-gray-500">
                    Recomendado: JPG ou PNG. Máx 5MB.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="text-sm px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
                  >
                    {uploadingPhoto ? 'Enviando...' : 'Carregar nova foto'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                    Nome Completo
                    </label>
                    <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                    Telefone
                    </label>
                    <input
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Bio / Sobre
                </label>
                <textarea
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Email (Login)
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={saveProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-200"
                >
                    <Save size={18} />
                    Salvar Alterações
                </button>
              </div>
            </div>
          </motion.section>

          {/* Security - 2FA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Segurança
                </h2>
                <p className="text-sm text-gray-500">
                  Proteja sua conta com autenticação de dois fatores
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                    <p className="font-medium text-gray-900">
                    Autenticação de Dois Fatores (2FA)
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                    {twoFactorEnabled 
                        ? 'Sua conta está protegida com uma camada extra de segurança.' 
                        : 'Adicione uma camada extra de segurança via App Autenticador.'}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={twoFactorEnabled}
                        onChange={toggle2FA}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>
          </motion.section>

          {/* Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-blue-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Notificações
                </h2>
                <p className="text-sm text-gray-500">
                  Gerencie como você recebe atualizações
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleOption
                label="Notificações por Email"
                description="Receba atualizações importantes por email"
                checked={notifications.email}
                onChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
              <ToggleOption
                label="Novas Tarefas e Prazos"
                description="Alertas sobre tarefas atribuídas e vencimentos próximos"
                checked={notifications.tasks}
                onChange={(checked) => setNotifications({ ...notifications, tasks: checked })}
              />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function ToggleOption({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="font-medium text-gray-900 mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  )
}
