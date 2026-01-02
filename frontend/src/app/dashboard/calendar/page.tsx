'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Film, DollarSign, Flag } from 'lucide-react';
import { productionsApi } from '@/lib/api';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import ProductionQuickView from '@/components/calendar/ProductionQuickView';

// Full interface matching ProductionQuickView
interface Production {
  id: number;
  title: string;
  shooting_sessions: Array<{
    date: string;
    location: string;
  }> | null;
  deadline: string | null;
  due_date: string | null;
  payment_method: string | null;
  payment_status: string;
  total_value: number;
  notes: string | null;
  crew: Array<{
    id: number;
    user_id: number;
    full_name: string | null;
    role: string;
    fee: number | null;
  }>;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'filming' | 'payment' | 'deadline' | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const { data: productions = [], error, isLoading } = useSWR('/api/v1/productions', productionsApi.getProductions);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    return productions.filter((production: Production) => {
      const dateStr = date.toISOString().split('T')[0];

      // Check shooting sessions
      if (production.shooting_sessions) {
        if (production.shooting_sessions.some(session => session.date === dateStr)) {
          return true;
        }
      }

      // Deadlines
      if (production.deadline) {
        const deadlineDate = new Date(production.deadline).toISOString().split('T')[0];
        if (deadlineDate === dateStr) {
          return true;
        }
      }

      // Due dates
      if (production.due_date) {
        const dueDate = new Date(production.due_date).toISOString().split('T')[0];
        if (dueDate === dateStr) {
          return true;
        }
      }

      return false;
    });
  };

  const getDetailedEventsForDay = (date: Date) => {
    const events: Array<{
      production: Production;
      type: 'filming' | 'payment' | 'deadline';
      date: string;
    }> = [];

    productions.forEach((production: Production) => {
      const dateStr = date.toISOString().split('T')[0];

      // Check shooting sessions
      if (production.shooting_sessions) {
        production.shooting_sessions.forEach(session => {
          if (session.date === dateStr) {
            events.push({
              production,
              type: 'filming',
              date: dateStr
            });
          }
        });
      }

      // Check deadlines
      if (production.deadline) {
        const deadlineDate = new Date(production.deadline).toISOString().split('T')[0];
        if (deadlineDate === dateStr) {
          events.push({
            production,
            type: 'deadline',
            date: dateStr
          });
        }
      }

      // Check due dates
      if (production.due_date) {
        const dueDate = new Date(production.due_date).toISOString().split('T')[0];
        if (dueDate === dateStr) {
          events.push({
            production,
            type: 'payment',
            date: dateStr
          });
        }
      }
    });

    return events;
  };

  const handleEventClick = (production: Production, eventType: 'filming' | 'payment' | 'deadline', eventDate: string) => {
    setSelectedProduction(production);
    setSelectedEventType(eventType);
    setSelectedEventDate(eventDate);
    setQuickViewOpen(true);
  };

  const handleEditComplete = () => {
    setQuickViewOpen(false);
    // Navigate to production details - we'll implement this later
    // For now, just close the modal
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="p-6 space-y-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/8 to-purple-500/8 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Calendário
            </h1>
            <p className="text-slate-400">
              Visualize todas as suas produções em um calendário interativo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-50 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-400" />
            </button>

            <h2 className="text-xl font-semibold text-slate-50">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square p-1" />;
              }

              const events = getEventsForDay(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={index}
                  className={`
                    aspect-square p-1 border rounded-lg transition-all duration-200
                    ${isToday ? 'bg-blue-500/20 border-blue-500/50' : 'border-white/5'}
                    ${isCurrentMonth ? 'text-slate-50' : 'text-slate-500'}
                    hover:bg-slate-800/50
                  `}
                >
                  <div className="h-full flex flex-col">
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>

                    <div className="flex-1 max-h-[120px] overflow-y-auto space-y-1">
                      {getDetailedEventsForDay(date).map((event, eventIndex) => (
                        <div
                          key={`${event.production.id}-${event.type}`}
                          className={`
                            text-xs p-1 rounded cursor-pointer transition-all duration-200
                            ${event.type === 'filming' ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50' : ''}
                            ${event.type === 'deadline' ? 'bg-red-500/30 text-red-200 border border-red-500/50' : ''}
                            ${event.type === 'payment' ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50' : ''}
                            hover:opacity-80
                          `}
                          title={`${event.production.title} - ${event.type === 'filming' ? 'Filmagem' : event.type === 'payment' ? 'Pagamento' : 'Prazo'}`}
                          onClick={() => handleEventClick(event.production, event.type, event.date)}
                        >
                          <div className="flex items-center gap-1">
                            {event.type === 'filming' && <Film className="h-3 w-3" />}
                            {event.type === 'payment' && <DollarSign className="h-3 w-3" />}
                            {event.type === 'deadline' && <Flag className="h-3 w-3" />}
                            <span className="truncate">{event.production.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Legenda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500/30 border border-blue-500/50 rounded"></div>
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-300">Dias de Filmagem</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500/30 border border-yellow-500/50 rounded"></div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-slate-300">Datas de Vencimento</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500/30 border border-red-500/50 rounded"></div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-red-400" />
                <span className="text-sm text-slate-300">Prazos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Quick View Modal */}
      <ProductionQuickView
        production={selectedProduction}
        eventType={selectedEventType}
        eventDate={selectedEventDate}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        onEditComplete={handleEditComplete}
      />
    </div>
  );
}
