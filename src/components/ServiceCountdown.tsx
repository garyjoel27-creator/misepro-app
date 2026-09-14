import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export function ServiceCountdown() {
  const { turnoActual, kanbanTareas } = useBrigadeStore();
  const { isDark } = useTheme();
  
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; totalMinutes: number } | null>(null);

  useEffect(() => {
    if (!turnoActual.horaPase) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes] = turnoActual.horaPase!.split(':').map(Number);
      
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      // Si ya pasó la hora del pase hoy, no mostramos negativo, o consideramos que es mañana
      // Para un uso de cocina, asumimos que es el pase actual
      const diffMs = targetTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, totalMinutes: 0 });
        return;
      }

      const totalMinutes = Math.floor(diffMs / 60000);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      setTimeLeft({ hours: h, minutes: m, totalMinutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [turnoActual.horaPase]);

  if (!timeLeft) return null;

  const tareasCriticasPendientes = kanbanTareas.filter(t => t.prioridad === 'Critica' && t.estado !== 'Completado').length;
  
  let statusClass = isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let isDanger = false;

  if (timeLeft.totalMinutes < 45 && tareasCriticasPendientes > 0) {
    statusClass = isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-700 bg-amber-50 border-amber-300';
  }
  
  if (timeLeft.totalMinutes < 30 && tareasCriticasPendientes > 0) {
    statusClass = isDark ? 'text-red-400 bg-red-500/15 border-red-500/40 shadow-sm shadow-red-500/20' : 'text-red-700 bg-red-50 border-red-400 shadow-sm shadow-red-500/10';
    isDanger = true;
  }

  return (
    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusClass}`}>
      {isDanger ? (
        <AlertTriangle className={`w-4 h-4 stroke-[2.5] ${isDanger ? 'animate-pulse text-red-500' : ''}`} />
      ) : (
        <Clock className="w-4 h-4 stroke-[2.5]" />
      )}
      <div className="flex flex-col">
        <span className="text-[0.6rem] font-bold uppercase tracking-widest opacity-80 leading-none mb-0.5">
          Pase en
        </span>
        <span className="text-sm font-black leading-none tracking-tight">
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}h
        </span>
      </div>
    </div>
  );
}
