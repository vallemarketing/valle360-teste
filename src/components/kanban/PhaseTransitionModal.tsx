'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Calendar, Link as LinkIcon, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { PhaseField, getPhaseFields } from '@/lib/kanban/phaseFields';
import { UserSelector } from '@/components/kanban/UserSelector';

interface PhaseTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Record<string, any>) => void;
  cardTitle: string;
  fromPhase: { id: string; title: string; color: string };
  toPhase: { id: string; title: string; color: string };
  area: string;
  clients?: { id: string; name: string }[];
  employees?: { id: string; name: string }[];
  existingData?: Record<string, any>;
  fieldsOverride?: PhaseField[];
}

export default function PhaseTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  cardTitle,
  fromPhase,
  toPhase,
  area,
  clients = [],
  employees = [],
  existingData = {},
  fieldsOverride,
}: PhaseTransitionModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Obter campos da fase de destino
  const fields = fieldsOverride ?? getPhaseFields(area, toPhase.id);

  useEffect(() => {
    if (isOpen) {
      // Pré-preencher com dados existentes
      setFormData(existingData);
      setErrors({});
    }
  }, [isOpen, existingData]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Limpar erro do campo
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleMultiSelectChange = (fieldId: string, value: string, checked: boolean) => {
    const currentValues = formData[fieldId] || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter((v: string) => v !== value);
    }
    handleChange(fieldId, newValues);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} é obrigatório`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onConfirm(formData);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: PhaseField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    const baseInputClass = `w-full px-3 py-2 rounded-lg border transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
    } focus:outline-none focus:ring-2 focus:ring-blue-200`;

    switch (field.type) {
      case 'text':
      case 'url':
      case 'number':
        return (
          <input
            type={field.type === 'url' ? 'url' : field.type}
            value={value}
            onChange={(e) => handleChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'select':
        // Campos especiais que usam dados dinâmicos
        if (field.id === 'client_id') {
          if (!clients?.length) {
            return (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder || 'ID do cliente (opcional)'}
                className={baseInputClass}
              />
            );
          }
          return (
            <select
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={baseInputClass}
            >
              <option value="">Selecione o cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          );
        }
        if (field.id === 'assigned_to' || field.id === 'reviewer') {
          return (
            <UserSelector
              selectedUserId={value || undefined}
              onSelect={(userId) => handleChange(field.id, userId)}
              label={field.label}
              placeholder={field.placeholder || 'Selecione um responsável'}
            />
          );
        }
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Selecione...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => handleMultiSelectChange(field.id, opt.value, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sim</span>
          </label>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mover Card</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Card Info */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <p className="font-semibold text-gray-900 mb-3">{cardTitle}</p>
              <div className="flex items-center gap-3">
                <div 
                  className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: fromPhase.color }}
                >
                  {fromPhase.title}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div 
                  className="px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: toPhase.color }}
                >
                  {toPhase.title}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma informação adicional necessária para esta fase.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  Preencha as informações necessárias para a fase <strong>{toPhase.title}</strong>
                </p>

                {fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                    {field.helpText && (
                      <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                    )}
                    {errors[field.id] && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
              style={{ backgroundColor: toPhase.color }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Movendo...
                </>
              ) : (
                <>
                  Confirmar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
