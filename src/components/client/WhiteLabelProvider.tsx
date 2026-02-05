'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface WhiteLabelConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName?: string;
  accentColor?: string;
}

interface WhiteLabelContextValue {
  config: WhiteLabelConfig | null;
  loading: boolean;
  setConfig: (config: WhiteLabelConfig) => void;
}

const defaultConfig: WhiteLabelConfig = {
  primaryColor: '#1672d6',
  secondaryColor: '#001533',
  companyName: 'Valle 360',
};

const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  config: defaultConfig,
  loading: false,
  setConfig: () => {},
});

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}

interface WhiteLabelProviderProps {
  clientId?: string;
  children: React.ReactNode;
}

/**
 * WhiteLabelProvider - Applies client-specific branding
 * Injects CSS variables based on client configuration
 */
export function WhiteLabelProvider({ clientId, children }: WhiteLabelProviderProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(defaultConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientConfig(clientId);
    } else {
      setConfig(defaultConfig);
    }
  }, [clientId]);

  useEffect(() => {
    if (config) {
      applyWhiteLabelStyles(config);
    }
  }, [config]);

  const loadClientConfig = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/${id}/branding`);
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setConfig({
            primaryColor: data.branding.primary_color || defaultConfig.primaryColor,
            secondaryColor: data.branding.secondary_color || defaultConfig.secondaryColor,
            logoUrl: data.branding.logo_url,
            faviconUrl: data.branding.favicon_url,
            companyName: data.branding.company_name,
            accentColor: data.branding.accent_color,
          });
        }
      }
    } catch (e) {
      console.error('Error loading white label config:', e);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const applyWhiteLabelStyles = (cfg: WhiteLabelConfig) => {
    const root = document.documentElement;

    // Convert hex to RGB for CSS variables
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : null;
    };

    // Generate color shades
    const generateShades = (baseColor: string, prefix: string) => {
      const rgb = hexToRgb(baseColor);
      if (!rgb) return;

      root.style.setProperty(`--${prefix}-500`, baseColor);
      root.style.setProperty(`--${prefix}-rgb`, rgb);
      
      // Light shades
      root.style.setProperty(`--${prefix}-50`, `${baseColor}0d`);
      root.style.setProperty(`--${prefix}-100`, `${baseColor}1a`);
      root.style.setProperty(`--${prefix}-200`, `${baseColor}33`);
      root.style.setProperty(`--${prefix}-300`, `${baseColor}4d`);
      root.style.setProperty(`--${prefix}-400`, `${baseColor}80`);
      
      // Dark shades (overlay black)
      root.style.setProperty(`--${prefix}-600`, baseColor);
      root.style.setProperty(`--${prefix}-700`, baseColor);
    };

    // Apply white-label specific variables
    root.style.setProperty('--client-primary', cfg.primaryColor);
    root.style.setProperty('--client-secondary', cfg.secondaryColor);
    
    if (cfg.accentColor) {
      root.style.setProperty('--client-accent', cfg.accentColor);
    }

    if (cfg.logoUrl) {
      root.style.setProperty('--client-logo', `url(${cfg.logoUrl})`);
    }

    // Update document title if company name is set
    if (cfg.companyName) {
      const baseTitle = document.title.split(' - ').pop() || 'Dashboard';
      document.title = `${cfg.companyName} - ${baseTitle}`;
    }

    // Update favicon if set
    if (cfg.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = cfg.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  };

  return (
    <WhiteLabelContext.Provider value={{ config, loading, setConfig }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

/**
 * API route handler for client branding
 * Should be created at: /api/client/[clientId]/branding/route.ts
 */
export default WhiteLabelProvider;
