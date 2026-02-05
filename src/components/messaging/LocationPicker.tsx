'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, X, Navigation } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

export function LocationPicker({ isOpen, onClose, onLocationSelect }: LocationPickerProps) {
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLocationName('Minha localização atual');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Erro ao obter localização. Verifique as permissões.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Coordenadas inválidas');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      alert('Coordenadas fora do intervalo válido');
      return;
    }

    onLocationSelect(latitude, longitude, locationName || 'Localização compartilhada');
    onClose();
    setLocationName('');
    setLat('');
    setLng('');
  };

  const openInMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Compartilhar Localização
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isGettingLocation ? 'Obtendo localização...' : 'Usar localização atual'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Ou</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Local
              </label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Escritório, Casa, Restaurante..."
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="-23.550520"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-46.633308"
                />
              </div>
            </div>

            {lat && lng && (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Coordenadas válidas!</strong>
                    <br />
                    {lat}, {lng}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={openInMaps}
                  className="w-full"
                  type="button"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Visualizar no Google Maps
                </Button>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!lat || !lng}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
