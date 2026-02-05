"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ZoomIn, 
  ZoomOut, 
  Contrast, 
  RotateCcw,
  Check,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================
// ACCESSIBILITY TAB - VALLE AI
// Configurações de acessibilidade no perfil
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
};

interface AccessibilityTabProps {
  userId: string;
}

export default function AccessibilityTab({ userId }: AccessibilityTabProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Carregar configurações salvas
    const saved = localStorage.getItem("valle_accessibility");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
    }
  }, []);

  const applySettings = (newSettings: AccessibilitySettings) => {
    // Aplicar tamanho da fonte
    document.documentElement.style.fontSize = `${newSettings.fontSize}%`;
    
    // Aplicar alto contraste
    if (newSettings.highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const updateSettings = (newSettings: AccessibilitySettings) => {
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem("valle_accessibility", JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSettings({ ...settings, fontSize: settings.fontSize + 25 });
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 75) {
      updateSettings({ ...settings, fontSize: settings.fontSize - 25 });
    }
  };

  const toggleHighContrast = () => {
    updateSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const resetSettings = () => {
    updateSettings(defaultSettings);
  };

  const hasChanges = settings.fontSize !== 100 || settings.highContrast;

  const fontSizeLabel = () => {
    if (settings.fontSize <= 75) return "Muito Pequeno";
    if (settings.fontSize === 100) return "Normal";
    if (settings.fontSize === 125) return "Grande";
    return "Muito Grande";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-2 border-[#001533]/10 dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#001533] dark:text-white">
            <Eye className="size-5 text-[#1672d6]" />
            Configurações de Acessibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tamanho da Fonte */}
          <div>
            <label className="text-sm font-medium text-[#001533] dark:text-white mb-3 block">
              Tamanho da Fonte
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 75}
                className="flex-1 h-14 border-2"
              >
                <ZoomOut className="size-5 mr-2" />
                Diminuir
              </Button>
              
              <div className="text-center min-w-[120px]">
                <p className="text-2xl font-bold text-[#001533] dark:text-white">
                  {settings.fontSize}%
                </p>
                <p className="text-sm text-[#001533]/60 dark:text-white/60">
                  {fontSizeLabel()}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={increaseFontSize}
                disabled={settings.fontSize >= 150}
                className="flex-1 h-14 border-2"
              >
                <ZoomIn className="size-5 mr-2" />
                Aumentar
              </Button>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-4 bg-[#001533]/5 dark:bg-white/5 rounded-xl">
              <p className="text-[#001533]/60 dark:text-white/60 text-xs mb-2">Prévia:</p>
              <p style={{ fontSize: `${settings.fontSize}%` }} className="text-[#001533] dark:text-white">
                Este é um exemplo de como o texto ficará com o tamanho selecionado.
              </p>
            </div>
          </div>

          {/* Alto Contraste */}
          <div>
            <label className="text-sm font-medium text-[#001533] dark:text-white mb-3 block">
              Alto Contraste
            </label>
            <button
              onClick={toggleHighContrast}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                settings.highContrast
                  ? "border-[#1672d6] bg-[#1672d6]/10"
                  : "border-[#001533]/10 dark:border-white/10 hover:border-[#1672d6]/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-10 rounded-lg flex items-center justify-center",
                  settings.highContrast ? "bg-[#1672d6]" : "bg-[#001533]/10 dark:bg-white/10"
                )}>
                  <Contrast className={cn(
                    "size-5",
                    settings.highContrast ? "text-white" : "text-[#001533] dark:text-white"
                  )} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#001533] dark:text-white">
                    {settings.highContrast ? "Alto Contraste Ativado" : "Alto Contraste Desativado"}
                  </p>
                  <p className="text-sm text-[#001533]/60 dark:text-white/60">
                    Aumenta o contraste das cores para melhor visibilidade
                  </p>
                </div>
              </div>
              {settings.highContrast && (
                <Check className="size-6 text-[#1672d6]" />
              )}
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-4 border-t border-[#001533]/10 dark:border-white/10">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={resetSettings}
                className="border-[#001533]/20"
              >
                <RotateCcw className="size-4 mr-2" />
                Restaurar Padrão
              </Button>
            )}
            
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-emerald-600"
              >
                <Check className="size-4" />
                <span className="text-sm font-medium">Salvo automaticamente</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informação */}
      <div className="text-center text-sm text-[#001533]/50 dark:text-white/50">
        <p>Suas preferências de acessibilidade são salvas automaticamente e aplicadas em todo o sistema.</p>
      </div>
    </motion.div>
  );
}

