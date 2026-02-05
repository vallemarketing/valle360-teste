'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, Building, Mail, Phone, MapPin, Briefcase, Upload, Check } from 'lucide-react';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: 'Guilherme Silva',
    companyName: 'Empresa XPTO',
    email: 'guilherme@empresa.com',
    phone: '(11) 98765-4321',
    position: 'CEO',
    department: 'Diretoria',
    address: {
      street: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
      }, 2000);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-valle-platinum dark:bg-valle-charcoal/30 rounded-lg">
              <User className="w-6 h-6 text-valle-steel" />
            </div>
            <div>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais e empresariais</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-valle-platinum dark:bg-valle-charcoal/20 rounded-lg">
              <div className="w-20 h-20 bg-valle-charcoal rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Foto de Perfil</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  JPG, PNG ou GIF. Tamanho máximo: 2MB
                </p>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Carregar Foto
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-valle-steel" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cargo
                    </label>
                    <Input
                      value={formData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      placeholder="Seu cargo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Departamento
                    </label>
                    <Input
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="Seu departamento"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-valle-steel" />
                  Informações da Empresa
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome da Empresa
                    </label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-valle-steel" />
                  Endereço
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rua e Número
                    </label>
                    <Input
                      value={formData.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade
                    </label>
                    <Input
                      value={formData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <Input
                      value={formData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="UF"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CEP
                    </label>
                    <Input
                      value={formData.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {showSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300">
                    Perfil atualizado com sucesso!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Suas informações foram salvas.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-valle-charcoal hover:bg-valle-steel"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
