import { Draggable } from '@hello-pangea/dnd';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { ShoppingModal } from './ShoppingModal';

export interface TaskCardProps {
  tarea: Tarea;
  index: number;
  isMobile?: boolean;
}

const ESTADOS: Tarea['estado'][] = ['Pendiente', 'En Proceso', 'Completado'];

const getPriorityBadgeStyle = (prioridad: Tarea['prioridad']) => {
  switch (prioridad) {
    case 'Critica':
      return 'bg-red-600 text-white border-slate-900';
    case 'Media':
      return 'bg-amber-400 text-slate-950 border-slate-900';
    case 'Baja':
      return 'bg-emerald-500 text-white border-slate-900';
    default:
      return 'bg-slate-800 text-white border-slate-900';
  }
};

function MobileSwipeCard({ tarea }: { tarea: Tarea }) {
  const moverTarea = useBrigadeStore(state => state.moverTarea);
  const x = useMotionValue(0);

  const currentIndex = ESTADOS.indexOf(tarea.estado);
  const canAdvance = currentIndex < ESTADOS.length - 1;
  const canBacktrack = currentIndex > 0;
  const nextState = canAdvance ? ESTADOS[currentIndex + 1] : null;
  const prevState = canBacktrack ? ESTADOS[currentIndex - 1] : null;

  // Hardware-accelerated transforms without triggering React re-renders during gesture
  const advanceOpacity = useTransform(x, [15, 65], [0, 1]);
  const backtrackOpacity = useTransform(x, [-65, -15], [1, 0]);
  const advanceScale = useTransform(x, [15, 65], [0.85, 1]);
  const backtrackScale = useTransform(x, [-65, -15], [1, 0.85]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 60;
    const velocityThreshold = 350;

    if ((info.offset.x > threshold || info.velocity.x > velocityThreshold) && canAdvance && nextState) {
      moverTarea(tarea.id, nextState);
    } else if ((info.offset.x < -threshold || info.velocity.x < -velocityThreshold) && canBacktrack && prevState) {
      moverTarea(tarea.id, prevState);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-950 mb-3 select-none">
      {/* Background Underlay 1: Advance (Right Swipe) - ONLY rendered if canAdvance */}
      {canAdvance && (
        <motion.div 
          style={{ opacity: advanceOpacity }}
          className="absolute inset-0 flex items-center justify-start pl-5 bg-emerald-500 text-slate-950 font-black pointer-events-none z-0"
        >
          <motion.div 
            style={{ scale: advanceScale }}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-6 h-6 stroke-[3]" />
            <div className="flex flex-col text-left">
              <span className="text-[0.65rem] uppercase font-black tracking-wider">Avanzar</span>
              <span className="text-sm font-black">{nextState}</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Background Underlay 2: Backtrack (Left Swipe) - ONLY rendered if canBacktrack */}
      {canBacktrack && (
        <motion.div 
          style={{ opacity: backtrackOpacity }}
          className="absolute inset-0 flex items-center justify-end pr-5 bg-blue-600 text-white font-black pointer-events-none z-0"
        >
          <motion.div 
            style={{ scale: backtrackScale }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-col text-right">
              <span className="text-[0.65rem] uppercase font-black tracking-wider">Retroceder</span>
              <span className="text-sm font-black">{prevState}</span>
            </div>
            <ArrowLeft className="w-6 h-6 stroke-[3]" />
          </motion.div>
        </motion.div>
      )}

      {/* Foreground Swipeable Surface */}
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag="x"
        dragDirectionLock
        dragConstraints={{
          left: canBacktrack ? -130 : 0,
          right: canAdvance ? 130 : 0,
        }}
        dragElastic={0.18}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white p-4 sm:p-5 flex flex-col gap-3.5"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <span className="text-[0.65rem] uppercase font-black tracking-wider text-slate-500 block mb-1">
              Partida: {tarea.partida}
            </span>
            <h4 className="font-black text-slate-950 text-xl leading-snug tracking-tight">
              {tarea.nombre}
            </h4>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider border-2 shrink-0 ${getPriorityBadgeStyle(tarea.prioridad)}`}>
            {tarea.prioridad}
          </span>
        </div>

        {/* Quantities & Status Info */}
        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border-2 border-slate-900">
          <div className="flex items-center gap-1 text-slate-900 font-black text-lg">
            <span className="text-amber-500 text-xl font-black">#</span>
            <span>{tarea.cantidad}</span>
            <span className="text-xs uppercase font-bold text-slate-600 tracking-wider ml-1">{tarea.unidad}</span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 text-amber-400 border border-slate-900">
            {tarea.estado}
          </span>
        </div>

        {/* Tactile Touch Action Bar (min-h-[44px] touch targets) */}
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 pt-2 border-t-2 border-slate-100"
        >
          {/* Backtrack button */}
          {canBacktrack && prevState ? (
            <button
              type="button"
              onClick={() => moverTarea(tarea.id, prevState)}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 border-2 border-slate-900 rounded-xl text-slate-900 font-black text-xs uppercase flex items-center gap-1.5 transition-colors"
              title={`Retroceder a ${prevState}`}
              aria-label={`Retroceder a ${prevState}`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span className="text-xs font-black">{prevState}</span>
            </button>
          ) : (
            <div className="min-w-[44px]" />
          )}

          {/* Quick Shopping Button */}
          <ShoppingModal tarea={tarea} />

          {/* Advance button */}
          {canAdvance && nextState ? (
            <button
              type="button"
              onClick={() => moverTarea(tarea.id, nextState)}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 border-2 border-slate-900 rounded-xl text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 transition-colors"
              title={`Avanzar a ${nextState}`}
              aria-label={`Avanzar a ${nextState}`}
            >
              <span className="text-xs font-black">{nextState}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <div className="min-w-[44px]" />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DesktopTaskCard({ tarea, index }: { tarea: Tarea; index: number }) {
  return (
    <Draggable draggableId={tarea.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className="mb-4 outline-none"
        >
          <div
            className={`bg-white rounded-2xl p-5 border-2 transition-all flex flex-col gap-3 select-none ${
              snapshot.isDragging 
                ? 'border-amber-500 ring-4 ring-slate-950 rotate-1 bg-amber-50/50 shadow-none' 
                : 'border-slate-900 hover:border-amber-500 shadow-none'
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <h4 className="font-black text-slate-950 text-lg leading-tight tracking-tight">
                {tarea.nombre}
              </h4>
              <span className={`text-xs px-2.5 py-1 rounded-md font-black uppercase tracking-wider border-2 shrink-0 ${getPriorityBadgeStyle(tarea.prioridad)}`}>
                {tarea.prioridad}
              </span>
            </div>

            <div className="flex justify-between items-center mt-1 pt-3 border-t-2 border-slate-100">
              <div className="text-base font-black text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-xl border-2 border-slate-900 flex items-center gap-1.5">
                <span className="text-amber-600 font-black">#</span>
                <span>{tarea.cantidad}</span>
                <span className="text-xs uppercase font-bold text-slate-600 tracking-wider">{tarea.unidad}</span>
              </div>

              <div 
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <ShoppingModal tarea={tarea} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function TaskCard({ tarea, index, isMobile = false }: TaskCardProps) {
  if (isMobile) {
    return <MobileSwipeCard tarea={tarea} />;
  }
  return <DesktopTaskCard tarea={tarea} index={index} />;
}
