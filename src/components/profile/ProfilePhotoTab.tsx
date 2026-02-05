'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X, Check } from 'lucide-react';

interface ProfilePhotoTabProps {
  userId: string;
}

export default function ProfilePhotoTab({ userId }: ProfilePhotoTabProps) {
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [initials, setInitials] = useState('U');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCurrentPhoto();
  }, [userId]);

  const loadCurrentPhoto = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.user_metadata?.avatar_url) {
        setCurrentPhotoUrl(userData.user.user_metadata.avatar_url);
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        if (profileData.avatar_url) {
          setCurrentPhotoUrl(profileData.avatar_url);
        }
        if (profileData.full_name) {
          const names = profileData.full_name.split(' ');
          setInitials(names[0][0] + (names[1]?.[0] || ''));
        }
      }
    } catch (error) {
      console.error('Error loading photo:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setCurrentPhotoUrl(publicUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      alert('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      setCurrentPhotoUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      alert('Foto removida com sucesso!');
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Erro ao remover foto');
    }
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-48 h-48 rounded-2xl object-cover border-4 border-valle-blue-300 shadow-xl"
                  />
                ) : currentPhotoUrl ? (
                  <img
                    src={currentPhotoUrl}
                    alt="Foto de perfil"
                    className="w-48 h-48 rounded-2xl object-cover border-4 border-valle-silver-300 shadow-xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 flex items-center justify-center text-white text-6xl font-bold shadow-xl border-4 border-valle-silver-200">
                    {initials}
                  </div>
                )}

                {!previewUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 w-14 h-14 bg-valle-blue-600 hover:bg-valle-blue-700 rounded-full shadow-lg flex items-center justify-center border-4 border-white transition-colors"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-valle-navy-900 mb-2">Foto de Perfil</h2>
              <p className="text-valle-silver-600">
                {previewUrl
                  ? 'Prévia da nova foto. Clique em "Salvar Foto" para confirmar.'
                  : 'Clique no ícone da câmera para alterar sua foto'}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {uploading ? 'Salvando...' : 'Salvar Foto'}
                </Button>
                <Button
                  onClick={handleCancelPreview}
                  variant="outline"
                  disabled={uploading}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Alterar Foto
                </Button>
                {currentPhotoUrl && (
                  <Button
                    onClick={handleRemovePhoto}
                    variant="outline"
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    Remover Foto
                  </Button>
                )}
              </div>
            )}

            <div className="bg-valle-blue-50 border-2 border-valle-blue-200 rounded-xl p-4 text-left">
              <h4 className="font-semibold text-valle-navy-800 mb-2">Requisitos da Foto:</h4>
              <ul className="text-sm text-valle-silver-700 space-y-1">
                <li>• Formatos aceitos: JPG, PNG, WEBP</li>
                <li>• Tamanho máximo: 5MB</li>
                <li>• Recomendado: foto quadrada, mínimo 200x200px</li>
                <li>• A foto será redimensionada automaticamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
