import React, { useMemo } from 'react';
import { Workout } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

interface WorkoutCalendarProps {
  workouts: Workout[];
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  const today = new Date();
  
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [today]);

  const workoutDates = useMemo(() => {
    return workouts.map(w => {
      const d = w.date.toDate ? w.date.toDate() : new Date(w.date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });
  }, [workouts]);

  return (
    <div className="card-blur p-6 rounded-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon size={18} className="text-blue-500" />
          {format(today, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
        </h3>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div>
          <span>Com treino</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-xs font-bold text-gray-500 px-1 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          const dayTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
          const hasWorkout = workoutDates.includes(dayTime);
          const isCurrentMonth = isSameMonth(day, today);
          const isTodayDate = isToday(day);

          return (
            <div 
              key={idx} 
              className={`
                relative flex flex-col items-center justify-center p-2 rounded-xl border
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${hasWorkout ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-900/50 border-gray-800'}
                ${isTodayDate && !hasWorkout ? 'border-gray-500 bg-gray-800' : ''}
                aspect-square transition-all
              `}
            >
              <span className={`text-sm font-medium ${isTodayDate ? 'text-white' : 'text-gray-400'} ${hasWorkout && 'text-blue-400'}`}>
                {format(day, 'd')}
              </span>
              {hasWorkout && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 size={12} className="text-blue-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
