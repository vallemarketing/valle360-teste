'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ConnectedNetwork {
  id: string;
  platform: string;
  accountName: string;
  accountAvatar?: string;
}

interface NetworkSelectorProps {
  clientId: string;
  connectedNetworks: ConnectedNetwork[];
  selectedNetworks: string[];
  onSelectionChange: (networks: string[]) => void;
  demandType?: string;
}

const PLATFORM_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  instagram: { icon: Instagram, color: '#E4405F', label: 'Instagram' },
  facebook: { icon: Facebook, color: '#1877F2', label: 'Facebook' },
  linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
  youtube: { icon: Youtube, color: '#FF0000', label: 'YouTube' },
  twitter: { icon: Twitter, color: '#000000', label: 'Twitter/X' },
};

// Platform compatibility for different content types
const PLATFORM_COMPATIBILITY: Record<string, string[]> = {
  instagram_post: ['instagram'],
  facebook_post: ['facebook'],
  linkedin_post: ['linkedin'],
  youtube_video: ['youtube'],
  reels: ['instagram', 'facebook'], // Reels can go to both
  carousel: ['instagram', 'linkedin'], // Carousels work on both
  full_campaign: ['instagram', 'facebook', 'linkedin'],
};

/**
 * NetworkSelector - Dynamic selector based on connected accounts
 * Only shows networks the client has connected
 * Filters by content type compatibility
 */
export function NetworkSelector({
  clientId,
  connectedNetworks,
  selectedNetworks,
  onSelectionChange,
  demandType = 'instagram_post',
}: NetworkSelectorProps) {
  // Get compatible platforms for this demand type
  const compatiblePlatforms = PLATFORM_COMPATIBILITY[demandType] || Object.keys(PLATFORM_CONFIG);

  // Filter to only show connected networks that are compatible
  const availableNetworks = connectedNetworks.filter(net =>
    compatiblePlatforms.includes(net.platform)
  );

  const toggleNetwork = (platform: string) => {
    if (selectedNetworks.includes(platform)) {
      onSelectionChange(selectedNetworks.filter(p => p !== platform));
    } else {
      onSelectionChange([...selectedNetworks, platform]);
    }
  };

  const selectAll = () => {
    onSelectionChange(availableNetworks.map(n => n.platform));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (connectedNetworks.length === 0) {
    return (
      <div
        className="p-6 rounded-xl border text-center"
        style={{ backgroundColor: 'var(--warning-50)', borderColor: 'var(--warning-200)' }}
      >
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--warning-500)' }} />
        <p className="font-medium" style={{ color: 'var(--warning-700)' }}>
          Nenhuma rede social conectada
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--warning-600)' }}>
          O cliente precisa conectar suas redes sociais antes de publicar.
        </p>
        <a
          href={`/cliente/${clientId}/redes-sociais`}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl font-medium text-white"
          style={{ backgroundColor: 'var(--warning-600)' }}
        >
          Conectar Redes
        </a>
      </div>
    );
  }

  if (availableNetworks.length === 0) {
    return (
      <div
        className="p-4 rounded-xl border"
        style={{ backgroundColor: 'var(--info-50)', borderColor: 'var(--info-200)' }}
      >
        <p className="text-sm" style={{ color: 'var(--info-700)' }}>
          ℹ️ Nenhuma rede compatível conectada para este tipo de conteúdo ({demandType}).
          <br />
          Redes necessárias: {compatiblePlatforms.join(', ')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      {availableNetworks.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)' }}
          >
            Selecionar todas
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)' }}
          >
            Limpar
          </button>
        </div>
      )}

      {/* Network grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {availableNetworks.map((network) => {
          const config = PLATFORM_CONFIG[network.platform];
          if (!config) return null;

          const Icon = config.icon;
          const isSelected = selectedNetworks.includes(network.platform);

          return (
            <motion.button
              key={network.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleNetwork(network.platform)}
              className="relative p-4 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: isSelected ? `${config.color}10` : 'var(--bg-secondary)',
                borderColor: isSelected ? config.color : 'var(--border-light)',
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.color }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </div>

              {/* Label */}
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {config.label}
              </div>

              {/* Account name */}
              <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {network.accountName}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selectedNetworks.length > 0 && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)' }}
        >
          ✅ {selectedNetworks.length} rede(s) selecionada(s):{' '}
          {selectedNetworks.map(p => PLATFORM_CONFIG[p]?.label || p).join(', ')}
        </div>
      )}
    </div>
  );
}

export default NetworkSelector;
