import { useState } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  ClipboardCheck, 
  Ban
} from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftHandoverModal({ isOpen, onClose }: ShiftHandoverModalProps) {
  const { isDark } = useTheme();
  const { 
    kanbanTareas, 
    agotados86, 
    nombreRestaurante,
    cerrarTurno
  } = useBrigadeStore();

  const [copied, setCopied] = useState(false);
  const [turnoConfirmado, setTurnoConfirmado] = useState(false);

  if (!isOpen) return null;

  const tareasCompletadas = kanbanTareas.filter(t => t.estado === 'Completado');
  const tareasCriticasPendientes = kanbanTareas.filter(t => t.estado !== 'Completado' && t.prioridad === 'Critica');
  const tareasRestantes = kanbanTareas.filter(t => t.estado !== 'Completado' && t.prioridad !== 'Critica');
  
  const totalTareas = kanbanTareas.length;
  const porcentajeMise = totalTareas > 0 
    ? Math.round((tareasCompletadas.length / totalTareas) * 100) 
    : 100;

  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Generador de texto para WhatsApp
  const generarTextoHandover = () => {
    let msg = `👨‍🍳 *PASE DE TURNO & RELEVO DE BRIGADA* 📋\n`;
    msg += `📍 *${nombreRestaurante || 'MisePro'}* • ${fechaStr.toUpperCase()} [${horaStr}]\n`;
    msg += `📊 *Mise en Place lista:* ${porcentajeMise}% (${tareasCompletadas.length}/${totalTareas} elaboraciones)\n\n`;

    if (tareasCriticasPendientes.length > 0) {
      msg += `🚨 *URGENTE / CRÍTICO PARA EL RELEVO:*\n`;
      tareasCriticasPendientes.forEach((t, i) => {
        msg += `  ${i + 1}. ⚠️ *${t.nombre}* (${t.partida})${t.cantidad ? ` - ${t.cantidad} ${t.unidad || 'Kg'}` : ''}\n`;
      });
      msg += `\n`;
    }

    if (agotados86.length > 0) {
      msg += `🚫 *FUERA DE CARTA / AGOTADOS (86):*\n`;
      agotados86.forEach((item, i) => {
        msg += `  ${i + 1}. *${item.nombre}* (${item.partida})${item.motivo ? ` - ${item.motivo}` : ''}\n`;
      });
      msg += `\n`;
    }

    if (tareasCompletadas.length > 0) {
      msg += `✅ *ELABORACIONES LISTAS EN CÁMARA:*\n`;
      tareasCompletadas.slice(0, 10).forEach(t => {
        msg += `  • ${t.nombre} (${t.partida})${t.cantidad ? ` [${t.cantidad} ${t.unidad || 'Kg'}]` : ''}\n`;
      });
      if (tareasCompletadas.length > 10) {
        msg += `  ... y ${tareasCompletadas.length - 10} elaboraciones más listas.\n`;
      }
      msg += `\n`;
    }

    if (tareasRestantes.length > 0) {
      msg += `📝 *OTRAS TAREAS PENDIENTES:* ${tareasRestantes.length} tareas normales en progreso.\n`;
    }

    msg += `\n🔥 _Enviado desde MisePro Brigade Sync_`;
    return msg;
  };

  const handleCopy = () => {
    const text = generarTextoHandover();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleWhatsApp = () => {
    const text = generarTextoHandover();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCerrarTurnoOficial = () => {
    cerrarTurno();
    setTurnoConfirmado(true);
    setTimeout(() => {
      setTurnoConfirmado(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl rounded-3xl border-2 p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto ${
        isDark 
          ? 'bg-[#0c1019] border-amber-500/30 text-slate-100 shadow-black/80' 
          : 'bg-white border-amber-500/30 text-stone-900 shadow-stone-900/10'
      }`}>
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-black tracking-tight text-amber-500 dark:text-amber-400">
                Pase de Turno & Relevo
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 capitalize">
                {fechaStr} • {horaStr}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-stone-300 dark:border-slate-800 flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen KPI de Mise en Place */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Estado de la Mise en Place
            </span>
            <div className="text-2xl font-black font-mono mt-0.5">
              {porcentajeMise}% <span className="text-xs font-normal text-stone-500">completado</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {tareasCompletadas.length} listas • {totalTareas - tareasCompletadas.length} pendientes
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-500 text-xl font-mono">
            {porcentajeMise}%
          </div>
        </div>

        {/* Bloque Crítico para el Relevo */}
        <div className="flex flex-col gap-3 my-2">
          {tareasCriticasPendientes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Urgente / Pendiente para el Turno Entrante ({tareasCriticasPendientes.length})</span>
              </div>
              <ul className="text-xs space-y-1 pl-1">
                {tareasCriticasPendientes.map(t => (
                  <li key={t.id} className="flex items-center justify-between font-semibold">
                    <span>⚠️ {t.nombre} <span className="opacity-70">({t.partida})</span></span>
                    {t.cantidad && <span className="font-mono">{t.cantidad} {t.unidad || 'Kg'}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bloque Agotados 86 */}
          {agotados86.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-2 text-stone-700 dark:text-slate-300">
                <Ban className="w-4 h-4 text-red-500" />
                <span>Fuera de Carta / Agotados 86 ({agotados86.length})</span>
              </div>
              <ul className="text-xs space-y-1 pl-1">
                {agotados86.map(item => (
                  <li key={item.id} className="text-stone-600 dark:text-slate-400 font-medium">
                    • <strong className="text-stone-900 dark:text-white">{item.nombre}</strong> ({item.partida}) {item.motivo ? `- ${item.motivo}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bloque Listas en Cámara */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Listas en Cámara ({tareasCompletadas.length})</span>
            </div>
            <p className="text-xs opacity-90 line-clamp-2">
              {tareasCompletadas.map(t => t.nombre).join(', ') || 'Sin elaboraciones completadas'}
            </p>
          </div>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-stone-200 dark:border-slate-800">
          <button
            onClick={handleWhatsApp}
            className="w-full min-h-[48px] rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Relevo por WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="min-h-[44px] rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleCerrarTurnoOficial}
              disabled={turnoConfirmado}
              className={`min-h-[44px] rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                turnoConfirmado 
                  ? 'bg-emerald-500 text-stone-950' 
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
              }`}
            >
              {turnoConfirmado ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Turno Cerrado</span>
                </>
              ) : (
                <span>Archivar Turno</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
