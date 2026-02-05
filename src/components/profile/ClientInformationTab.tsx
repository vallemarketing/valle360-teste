'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { User, Building2, MapPin, Plus, X, Upload } from 'lucide-react';
import type { ClientProfileExtended, AdditionalContact } from '@/types';

interface ClientInformationTabProps {
  userId: string;
}

export default function ClientInformationTab({ userId }: ClientInformationTabProps) {
  const [profile, setProfile] = useState<Partial<ClientProfileExtended>>({
    additional_contacts: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('client_profiles_extended')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_profiles_extended')
        .upsert({
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    setProfile({
      ...profile,
      additional_contacts: [
        ...(profile.additional_contacts || []),
        { name: '', position: '', email: '', phone: '' }
      ]
    });
  };

  const removeContact = (index: number) => {
    const contacts = [...(profile.additional_contacts || [])];
    contacts.splice(index, 1);
    setProfile({ ...profile, additional_contacts: contacts });
  };

  const updateContact = (index: number, field: keyof AdditionalContact, value: string) => {
    const contacts = [...(profile.additional_contacts || [])];
    contacts[index] = { ...contacts[index], [field]: value };
    setProfile({ ...profile, additional_contacts: contacts });
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-valle-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-valle-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-valle-navy-900">Dados Pessoais</h3>
              <p className="text-sm text-valle-silver-600">Informações básicas do cliente</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">CPF/CNPJ</label>
              <Input
                value={profile.cpf_cnpj || ''}
                onChange={(e) => setProfile({ ...profile, cpf_cnpj: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Data de Nascimento</label>
              <Input
                type="date"
                value={profile.birth_date || ''}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Telefone Comercial</label>
              <Input
                value={profile.phone_commercial || ''}
                onChange={(e) => setProfile({ ...profile, phone_commercial: e.target.value })}
                placeholder="(11) 3333-4444"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Telefone Celular</label>
              <Input
                value={profile.phone_mobile || ''}
                onChange={(e) => setProfile({ ...profile, phone_mobile: e.target.value })}
                placeholder="(11) 98888-9999"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-valle-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-valle-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-valle-navy-900">Dados da Empresa</h3>
              <p className="text-sm text-valle-silver-600">Informações corporativas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Razão Social</label>
              <Input
                value={profile.company_name || ''}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                placeholder="Empresa Exemplo Ltda"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Setor de Atuação</label>
              <select
                value={profile.business_sector || ''}
                onChange={(e) => setProfile({ ...profile, business_sector: e.target.value })}
                className="w-full px-3 py-2 border-2 border-valle-silver-300 rounded-lg focus:border-valle-blue-500 focus:outline-none"
              >
                <option value="">Selecione...</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="saude">Saúde</option>
                <option value="educacao">Educação</option>
                <option value="varejo">Varejo</option>
                <option value="servicos">Serviços</option>
                <option value="industria">Indústria</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-valle-blue-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-valle-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-valle-navy-900">Endereço</h3>
              <p className="text-sm text-valle-silver-600">Localização da empresa</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">CEP</label>
              <Input
                value={profile.address_zip || ''}
                onChange={(e) => setProfile({ ...profile, address_zip: e.target.value })}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Rua</label>
              <Input
                value={profile.address_street || ''}
                onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                placeholder="Avenida Exemplo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Número</label>
              <Input
                value={profile.address_number || ''}
                onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                placeholder="123"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Complemento</label>
              <Input
                value={profile.address_complement || ''}
                onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })}
                placeholder="Sala 45"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Bairro</label>
              <Input
                value={profile.address_neighborhood || ''}
                onChange={(e) => setProfile({ ...profile, address_neighborhood: e.target.value })}
                placeholder="Centro"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Cidade</label>
              <Input
                value={profile.address_city || ''}
                onChange={(e) => setProfile({ ...profile, address_city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Estado</label>
              <Input
                value={profile.address_state || ''}
                onChange={(e) => setProfile({ ...profile, address_state: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-valle-navy-900 mb-4">Redes Sociais</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Instagram</label>
              <Input
                value={profile.social_instagram || ''}
                onChange={(e) => setProfile({ ...profile, social_instagram: e.target.value })}
                placeholder="https://instagram.com/empresa"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Facebook</label>
              <Input
                value={profile.social_facebook || ''}
                onChange={(e) => setProfile({ ...profile, social_facebook: e.target.value })}
                placeholder="https://facebook.com/empresa"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">LinkedIn</label>
              <Input
                value={profile.social_linkedin || ''}
                onChange={(e) => setProfile({ ...profile, social_linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/empresa"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">YouTube</label>
              <Input
                value={profile.social_youtube || ''}
                onChange={(e) => setProfile({ ...profile, social_youtube: e.target.value })}
                placeholder="https://youtube.com/@empresa"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Website</label>
              <Input
                value={profile.social_website || ''}
                onChange={(e) => setProfile({ ...profile, social_website: e.target.value })}
                placeholder="https://www.empresa.com.br"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-valle-navy-900">Contatos Adicionais</h3>
            <Button onClick={addContact} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Contato
            </Button>
          </div>

          <div className="space-y-4">
            {(profile.additional_contacts || []).map((contact, index) => (
              <div key={index} className="p-4 border-2 border-valle-silver-200 rounded-xl relative">
                <button
                  onClick={() => removeContact(index)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="grid md:grid-cols-2 gap-4 pr-10">
                  <div>
                    <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Nome</label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Cargo</label>
                    <Input
                      value={contact.position}
                      onChange={(e) => updateContact(index, 'position', e.target.value)}
                      placeholder="Cargo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Email</label>
                    <Input
                      value={contact.email}
                      onChange={(e) => updateContact(index, 'email', e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-valle-navy-700 mb-2 block">Telefone</label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      placeholder="(11) 98888-9999"
                    />
                  </div>
                </div>
              </div>
            ))}
            {(profile.additional_contacts || []).length === 0 && (
              <p className="text-center text-valle-silver-500 py-8">Nenhum contato adicional cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
        <Button variant="outline" onClick={loadProfile} className="flex-1">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
