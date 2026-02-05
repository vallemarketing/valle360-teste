'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatar: string;
}

interface MeetingSchedulerModalProps {
  onClose: () => void;
}

export function MeetingSchedulerModal({ onClose }: MeetingSchedulerModalProps) {
  const [step, setStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');

  // TODO: Buscar colaboradores reais do Supabase
  const employees: Employee[] = [
    {
      id: '1',
      name: 'Maria Santos',
      role: 'Social Media',
      specialty: 'Estratégia de Conteúdo',
      avatar: 'MS',
    },
    {
      id: '2',
      name: 'João Silva',
      role: 'Gestor de Tráfego',
      specialty: 'Performance de Anúncios',
      avatar: 'JS',
    },
    {
      id: '3',
      name: 'Ana Costa',
      role: 'Designer Gráfico',
      specialty: 'Identidade Visual',
      avatar: 'AC',
    },
    {
      id: '4',
      name: 'Carlos Mendes',
      role: 'Web Designer',
      specialty: 'Desenvolvimento Web',
      avatar: 'CM',
    },
  ];

  const availableSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  const handleSchedule = () => {
    // TODO: Salvar no Supabase
    console.log({
      employee: selectedEmployee,
      date: selectedDate,
      time: selectedTime,
      duration,
      notes,
    });
    setStep(4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-valle-silver-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-valle-navy-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-valle-blue-600" />
              Agendar Reunião
            </CardTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-valle-silver-100 transition-colors"
            >
              <X className="w-5 h-5 text-valle-silver-600" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-valle-blue-600 text-white'
                      : 'bg-valle-silver-200 text-valle-silver-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > s ? 'bg-valle-blue-600' : 'bg-valle-silver-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Select Employee */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-valle-navy-900 mb-2">
                  Selecione o Profissional
                </h3>
                <p className="text-sm text-valle-silver-600">
                  Escolha com quem você gostaria de reunir
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setStep(2);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg text-left ${
                      selectedEmployee?.id === employee.id
                        ? 'border-valle-blue-600 bg-valle-blue-50'
                        : 'border-valle-silver-200 hover:border-valle-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-valle-blue-500 to-valle-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {employee.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-valle-navy-900 mb-1">
                          {employee.name}
                        </h4>
                        <Badge variant="outline" className="mb-2">
                          {employee.role}
                        </Badge>
                        <p className="text-xs text-valle-silver-600">
                          {employee.specialty}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-valle-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date and Time */}
          {step === 2 && selectedEmployee && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-valle-navy-900 mb-2">
                  Escolha Data e Horário
                </h3>
                <p className="text-sm text-valle-silver-600">
                  Reunião com {selectedEmployee.name}
                </p>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-valle-navy-700">
                  Data da Reunião
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 border-2 border-valle-silver-300"
                />
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-valle-navy-700">
                  Duração
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        duration === d
                          ? 'border-valle-blue-600 bg-valle-blue-50 text-valle-blue-700'
                          : 'border-valle-silver-200 hover:border-valle-blue-400'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-valle-navy-700">
                    Horário Disponível
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          selectedTime === slot
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-valle-silver-200 hover:border-valle-blue-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 bg-valle-blue-600 hover:bg-valle-blue-700"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation and Notes */}
          {step === 3 && selectedEmployee && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-valle-navy-900 mb-2">
                  Confirmar Reunião
                </h3>
                <p className="text-sm text-valle-silver-600">
                  Revise os detalhes antes de confirmar
                </p>
              </div>

              {/* Summary Card */}
              <Card className="border-2 border-valle-blue-200 bg-gradient-to-r from-valle-blue-50 to-white">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-valle-blue-600" />
                    <div>
                      <p className="text-sm text-valle-silver-600">Profissional</p>
                      <p className="font-semibold text-valle-navy-900">
                        {selectedEmployee.name} - {selectedEmployee.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-valle-blue-600" />
                    <div>
                      <p className="text-sm text-valle-silver-600">Data</p>
                      <p className="font-semibold text-valle-navy-900">
                        {new Date(selectedDate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-valle-blue-600" />
                    <div>
                      <p className="text-sm text-valle-silver-600">Horário e Duração</p>
                      <p className="font-semibold text-valle-navy-900">
                        {selectedTime} ({duration} minutos)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-valle-navy-700">
                  Pauta da Reunião (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva brevemente os tópicos que gostaria de discutir..."
                  className="w-full h-32 p-3 rounded-lg border-2 border-valle-silver-300 focus:border-valle-blue-500 focus:ring-2 focus:ring-valle-blue-200 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSchedule}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Reunião
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && selectedEmployee && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-valle-navy-900 mb-2">
                Reunião Agendada!
              </h3>
              <p className="text-valle-silver-600 mb-6">
                Sua reunião foi confirmada com sucesso
              </p>

              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white max-w-md mx-auto mb-6">
                <CardContent className="p-4 text-left space-y-2">
                  <p className="text-sm text-valle-silver-600">
                    <strong>Com:</strong> {selectedEmployee.name}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Horário:</strong> {selectedTime}
                  </p>
                  <p className="text-sm text-valle-silver-600">
                    <strong>Duração:</strong> {duration} minutos
                  </p>
                </CardContent>
              </Card>

              <p className="text-sm text-valle-silver-600 mb-6">
                Um link de reunião será enviado por email em breve
              </p>

              <Button
                onClick={onClose}
                className="bg-valle-blue-600 hover:bg-valle-blue-700"
              >
                Fechar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
