import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Pencil, Trash2, Star } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { ShoppingModal } from './ShoppingModal';
import { useTheme } from '../hooks/useTheme';

export interface TaskCardProps {
  tarea: Tarea;
  index: number;
  isMobile?: boolean;
}

const ESTADOS: Tarea['estado'][] = ['Pendiente', 'En Proceso', 'Completado'];

export function PriorityBeaconBadge({ prioridad }: { prioridad: Tarea['prioridad'] }) {
  switch (prioridad) {
    case 'Critica':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span>Crítica</span>
        </span>
      );
    case 'Media':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Media</span>
        </span>
      );
    case 'Baja':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-medium uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Baja</span>
        </span>
      );
    default:
      return null;
  }
}

/**
 * Celdas iOS Ultra-Compactas (Estilo Recordatorios de Apple)
 * Ciclo in-place fluido: Pendiente ➔ En Proceso ➔ Finalizado.
 * Cero desaparición abrupta, feedback háptico y catálogo de procesos.
 */
export function TaskCard({ tarea, index, isMobile = false }: TaskCardProps) {
  const { 
    moverTarea, 
    actualizarTarea, 
    eliminarTarea, 
    isChefMode, 
    pinJefe,
    procesosHabituales,
    guardarProcesoHabitual
  } = useBrigadeStore();
  const { isDark } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(tarea.nombre);
  const [editCantidad, setEditCantidad] = useState(tarea.cantidad);
  const [isFlashing, setIsFlashing] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const currentIndex = ESTADOS.indexOf(tarea.estado);
  const isCompletado = tarea.estado === 'Completado';
  const isEnProceso = tarea.estado === 'En Proceso';

  const hoyStr = new Date().toISOString().split('T')[0];
  const caducaHoy = tarea.fechaCaducidad === hoyStr;

  const yaEsProceso = procesosHabituales.some(
    p => p.partida === tarea.partida && p.nombre.toLowerCase() === tarea.nombre.toLowerCase()
  );

  const handleToggleState = () => {
    // Feedback háptico en móvil
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }

    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      if (currentIndex < ESTADOS.length - 1) {
        moverTarea(tarea.id, ESTADOS[currentIndex + 1]);
      } else {
        moverTarea(tarea.id, 'Pendiente');
      }
    }, 120);
  };

  const handleGuardarProceso = () => {
    guardarProcesoHabitual({
      nombre: tarea.nombre,
      partida: tarea.partida,
      cantidadSugerida: tarea.cantidad,
      unidad: tarea.unidad,
      prioridad: tarea.prioridad
    });
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editNombre.trim()) {
      actualizarTarea(tarea.id, { nombre: editNombre.trim(), cantidad: editCantidad });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!isChefMode) {
      const p = prompt("Acción protegida por el Chef. Introduce el PIN:");
      if (p !== (pinJefe || "1234")) {
        alert("PIN incorrecto.");
        return;
      }
    }
    if (confirm(`¿Eliminar elaboración "${tarea.nombre}"?`)) {
      eliminarTarea(tarea.id);
    }
  };

  const cardContent = (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={`group relative flex items-center gap-2.5 px-3 py-2 transition-all duration-200 border-b border-stone-200/40 dark:border-slate-800/40 last:border-b-0 ${
        isEnProceso
          ? isDark
            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-2 border-l-amber-500 text-amber-100'
            : 'bg-amber-50/80 hover:bg-amber-100/70 border-l-2 border-l-amber-500 text-amber-950'
          : isCompletado
          ? 'opacity-40'
          : isDark
          ? 'bg-slate-900/40 hover:bg-slate-850/60 active:bg-slate-800/60 text-slate-100'
          : 'bg-white/40 hover:bg-stone-50/70 active:bg-stone-100/70 text-stone-900'
      }`}
    >
      {savedBadge && (
        <span className="absolute right-10 -top-2.5 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full shadow-md z-20 animate-pulse">
          ⭐ ¡Guardado en Procesos!
        </span>
      )}

      {/* Ultra-compact iOS Circular Checkbox */}
      <button
        type="button"
        onClick={handleToggleState}
        disabled={isFlashing}
        className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-300 outline-none cursor-pointer active:scale-90 ${
          isCompletado
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : isEnProceso
            ? 'border-amber-500 bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30'
            : 'border-stone-300 dark:border-slate-600 bg-stone-100/30 dark:bg-slate-800/30 text-transparent hover:border-amber-400 hover:bg-amber-400/10'
        }`}
        title={
          isCompletado ? 'Completado (Toca para reiniciar)' :
          isEnProceso ? 'En proceso (Toca para completar)' :
          'Pendiente (Toca para iniciar)'
        }
      >
        <AnimatePresence>
          {isFlashing && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-full bg-amber-400 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {isCompletado ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : isEnProceso ? (
          <Flame className="w-3.5 h-3.5 stroke-[2.5] text-amber-500 animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-amber-400 transition-colors" />
        )}
      </button>

      {/* Main Info - Extremely Condensed */}
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className={`text-[13px] sm:text-sm font-medium tracking-tight truncate transition-all duration-300 ${
            isCompletado
              ? 'line-through text-stone-400 dark:text-slate-500'
              : isEnProceso
              ? 'font-bold text-amber-600 dark:text-amber-400'
              : 'text-stone-900 dark:text-slate-100'
          }`}>
            {tarea.nombre}
          </span>
          {caducaHoy && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Caduca Hoy" />
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] sm:text-xs font-bold font-mono tracking-tighter ${
            isCompletado ? 'text-stone-400 dark:text-slate-500' : isEnProceso ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-slate-300'
          }`}>
            {tarea.cantidad}{tarea.unidad.charAt(0)}
          </span>
          {!isCompletado && <PriorityBeaconBadge prioridad={tarea.prioridad} />}
        </div>
      </div>

      {/* Quick iOS Action Buttons - Smaller for compact list */}
      <div className="flex items-center gap-0.5 shrink-0">
        <ShoppingModal tarea={tarea} compact />

        <button
          type="button"
          onClick={handleGuardarProceso}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
            yaEsProceso
              ? 'text-amber-400 hover:text-amber-500'
              : 'text-stone-400 hover:text-amber-400 dark:text-slate-500 dark:hover:text-amber-400'
          }`}
          title={yaEsProceso ? 'En catálogo de procesos habituales' : 'Guardar en procesos habituales de la partida'}
        >
          <Star className={`w-3 h-3 ${yaEsProceso ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Editar tarea"
        >
          <Pencil className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          title="Eliminar tarea"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className={`p-3.5 border-b last:border-b-0 transition-all ${
          isDark ? 'bg-slate-850 border-amber-500/30' : 'bg-white border-amber-400/40'
        }`}
      >
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className={`w-full px-3 py-2 text-sm font-semibold rounded-lg border outline-none focus:ring-2 focus:ring-amber-400 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
            }`}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={editCantidad}
              onChange={(e) => setEditCantidad(Number(e.target.value))}
              className={`w-24 px-2 py-1.5 text-center text-sm font-black rounded-lg border outline-none focus:ring-2 focus:ring-amber-400 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
              }`}
            />
            <span className="text-xs font-bold uppercase text-stone-500">{tarea.unidad}</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    );
  }

  // Desktop with DragDrop support
  if (!isMobile) {
    return (
      <Draggable draggableId={tarea.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`transition-shadow ${
              snapshot.isDragging ? 'shadow-2xl rounded-xl ring-2 ring-amber-400 z-50' : ''
            }`}
          >
            {cardContent}
          </div>
        )}
      </Draggable>
    );
  }

  return cardContent;
}
