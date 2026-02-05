"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Accessibility, 
  ZoomIn, 
  ZoomOut, 
  Contrast, 
  RotateCcw,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// ACCESSIBILITY MENU - VALLE AI
// Menu de acessibilidade
// Cores: #001533 (navy), #1672d6 (primary), #ffffff (white)
// ============================================

interface AccessibilitySettings {
  fontSize: number; // 100 = normal, 125 = grande, 150 = muito grande
  highContrast: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
};

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    // Carregar configurações salvas
    const saved = localStorage.getItem("valle_accessibility");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      applySettings(parsed);
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

  return (
    <div className="relative">
      {/* Botão de Acessibilidade */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "hover:bg-[#001533]/5 dark:hover:bg-white/5",
          isOpen && "bg-[#1672d6]/10",
          hasChanges && "text-[#1672d6]"
        )}
        title="Acessibilidade"
      >
        <Accessibility className="size-5" />
      </button>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute right-0 top-full mt-2 w-72 z-50",
              "bg-white dark:bg-[#0a0f1a] rounded-xl shadow-2xl",
              "border border-[#001533]/10 dark:border-white/10",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#001533]/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility className="size-5 text-[#1672d6]" />
                <h3 className="font-semibold text-[#001533] dark:text-white">
                  Acessibilidade
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#001533]/5 rounded-lg"
              >
                <X className="size-4 text-[#001533]/50" />
              </button>
            </div>

            {/* Options */}
            <div className="p-4 space-y-4">
              {/* Tamanho da Fonte */}
              <div>
                <label className="text-sm font-medium text-[#001533] dark:text-white mb-2 block">
                  Tamanho da Fonte
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decreaseFontSize}
                    disabled={settings.fontSize <= 75}
                    className="flex-1"
                  >
                    <ZoomOut className="size-4 mr-1" />
                    A-
                  </Button>
                  <span className="text-sm font-medium text-[#001533] dark:text-white w-12 text-center">
                    {settings.fontSize}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={increaseFontSize}
                    disabled={settings.fontSize >= 150}
                    className="flex-1"
                  >
                    <ZoomIn className="size-4 mr-1" />
                    A+
                  </Button>
                </div>
              </div>

              {/* Alto Contraste */}
              <div>
                <label className="text-sm font-medium text-[#001533] dark:text-white mb-2 block">
                  Alto Contraste
                </label>
                <button
                  onClick={toggleHighContrast}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between",
                    settings.highContrast
                      ? "border-[#1672d6] bg-[#1672d6]/10"
                      : "border-[#001533]/10 hover:border-[#1672d6]/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Contrast className="size-5 text-[#001533] dark:text-white" />
                    <span className="text-sm text-[#001533] dark:text-white">
                      {settings.highContrast ? "Ativado" : "Desativado"}
                    </span>
                  </div>
                  {settings.highContrast && (
                    <Check className="size-5 text-[#1672d6]" />
                  )}
                </button>
              </div>

              {/* Resetar */}
              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                  className="w-full border-[#001533]/20"
                >
                  <RotateCcw className="size-4 mr-2" />
                  Restaurar Padrão
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="px-4 pb-4">
              <p className="text-xs text-[#001533]/50 dark:text-white/50 text-center">
                Suas preferências são salvas automaticamente
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CSS para alto contraste (adicionar no globals.css)
export const highContrastStyles = `
  .high-contrast {
    --foreground: 0 0% 0%;
    --background: 0 0% 100%;
  }
  
  .high-contrast * {
    border-color: currentColor !important;
  }
  
  .dark.high-contrast {
    --foreground: 0 0% 100%;
    --background: 0 0% 0%;
  }
`;

