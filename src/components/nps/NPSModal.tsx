"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ============================================
// NPS MODAL - VALLE AI
// Modal de avaliação Net Promoter Score
// ============================================

interface NPSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: number, comment: string) => void;
}

const scoreLabels: Record<number, { label: string; emoji: string }> = {
  0: { label: "Muito insatisfeito", emoji: "😞" },
  1: { label: "Muito insatisfeito", emoji: "😞" },
  2: { label: "Insatisfeito", emoji: "😔" },
  3: { label: "Insatisfeito", emoji: "😔" },
  4: { label: "Pouco satisfeito", emoji: "😐" },
  5: { label: "Neutro", emoji: "😐" },
  6: { label: "Neutro", emoji: "😐" },
  7: { label: "Satisfeito", emoji: "🙂" },
  8: { label: "Satisfeito", emoji: "😊" },
  9: { label: "Muito satisfeito", emoji: "😃" },
  10: { label: "Extremamente satisfeito", emoji: "🤩" },
};

export function NPSModal({ isOpen, onClose, onSubmit }: NPSModalProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedScore !== null) {
      onSubmit(selectedScore, comment);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedScore(null);
        setComment("");
        onClose();
      }, 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 6) return "bg-red-500 hover:bg-red-600";
    if (score <= 8) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-emerald-500 hover:bg-emerald-600";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-full max-w-lg",
              "bg-white dark:bg-[#0a0f1a] rounded-2xl shadow-2xl",
              "border border-[#001533]/10 dark:border-white/10",
              "overflow-hidden"
            )}
          >
            {submitted ? (
              /* Success State */
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#001533] dark:text-white mb-2">
                  Obrigado! 💜
                </h3>
                <p className="text-[#001533]/70 dark:text-white/70">
                  Sua opinião é muito importante para nós.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="relative p-6 pb-4 bg-gradient-to-r from-[#001533] to-[#1672d6] text-white">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-white/80">
                      Pesquisa de Satisfação
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">
                    De 0 a 10, o quanto você recomendaria a Valle 360?
                  </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Score Selection */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-[#001533]/50 dark:text-white/50">
                        Pouco provável
                      </span>
                      <span className="text-xs text-[#001533]/50 dark:text-white/50">
                        Muito provável
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => setSelectedScore(score)}
                          className={cn(
                            "flex-1 aspect-square rounded-lg font-semibold text-sm transition-all",
                            selectedScore === score
                              ? cn(getScoreColor(score), "text-white scale-110 shadow-lg")
                              : "bg-[#001533]/5 dark:bg-white/5 text-[#001533] dark:text-white hover:bg-[#001533]/10 dark:hover:bg-white/10"
                          )}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Score Label */}
                  {selectedScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-2"
                    >
                      <span className="text-3xl mr-2">
                        {scoreLabels[selectedScore].emoji}
                      </span>
                      <span className="text-[#001533] dark:text-white font-medium">
                        {scoreLabels[selectedScore].label}
                      </span>
                    </motion.div>
                  )}

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-[#001533] dark:text-white mb-2">
                      Quer deixar um comentário? (opcional)
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Conte-nos mais sobre sua experiência..."
                      className="resize-none border-[#001533]/10 dark:border-white/10 focus:border-[#1672d6]"
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedScore === null}
                    className={cn(
                      "w-full py-6 text-lg font-semibold rounded-xl",
                      "bg-[#1672d6] hover:bg-[#1260b5] text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Avaliação
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NPSModal;
