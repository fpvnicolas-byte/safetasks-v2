'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Film, DollarSign, Flag } from 'lucide-react';
import { productionsApi } from '@/lib/api';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';

// Simple interface for calendar display
interface Production {
  id: number;
  title: string;
  filming_dates: string | null;
  deadline: string | null;
  due_date: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

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
      // Filming dates
      if (production.filming_dates) {
        const filmingDates = production.filming_dates.split(',').map((d: string) => d.trim());
        const dateStr = date.toISOString().split('T')[0];
        if (filmingDates.some((filmingDate: string) => filmingDate === dateStr)) {
          return true;
        }
      }

      // Deadlines
      if (production.deadline) {
        const deadlineDate = new Date(production.deadline).toISOString().split('T')[0];
        const dateStr = date.toISOString().split('T')[0];
        if (deadlineDate === dateStr) {
          return true;
        }
      }

      // Due dates
      if (production.due_date) {
        const dueDate = new Date(production.due_date).toISOString().split('T')[0];
        const dateStr = date.toISOString().split('T')[0];
        if (dueDate === dateStr) {
          return true;
        }
      }

      return false;
    });
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

                    <div className="flex-1 space-y-1 overflow-hidden">
                      {events.slice(0, 3).map((production: Production) => {
                        const isFilmingDay = production.filming_dates?.split(',').some((d: string) =>
                          d.trim() === date.toISOString().split('T')[0]
                        );
                        const isDeadline = production.deadline &&
                          new Date(production.deadline).toDateString() === date.toDateString();
                        const isDueDate = production.due_date &&
                          new Date(production.due_date).toDateString() === date.toDateString();

                        return (
                          <div
                            key={production.id}
                            className={`
                              text-xs p-1 rounded cursor-pointer transition-all duration-200
                              ${isFilmingDay ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50' : ''}
                              ${isDeadline ? 'bg-red-500/30 text-red-200 border border-red-500/50' : ''}
                              ${isDueDate ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50' : ''}
                              hover:opacity-80
                            `}
                            title={production.title}
                          >
                            <div className="flex items-center gap-1">
                              {isFilmingDay && <Film className="h-3 w-3" />}
                              {isDueDate && <DollarSign className="h-3 w-3" />}
                              {isDeadline && <Flag className="h-3 w-3" />}
                              <span className="truncate">{production.title}</span>
                            </div>
                          </div>
                        );
                      })}

                      {events.length > 3 && (
                        <div className="text-xs text-slate-500 px-1">
                          +{events.length - 3} mais
                        </div>
                      )}
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
    </div>
  );
}
