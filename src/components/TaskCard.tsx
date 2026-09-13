import { Draggable } from '@hello-pangea/dnd';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { ShoppingModal } from './ShoppingModal';
import { getStationConfig } from '../types/stations';

export interface TaskCardProps {
  tarea: Tarea;
  index: number;
  isMobile?: boolean;
}

const ESTADOS: Tarea['estado'][] = ['Pendiente', 'En Proceso', 'Completado'];

function PriorityBeaconBadge({ prioridad }: { prioridad: Tarea['prioridad'] }) {
  switch (prioridad) {
    case 'Critica':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 shadow-sm shadow-red-500/20 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span>Crítica</span>
        </span>
      );
    case 'Media':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/20 shrink-0">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Media</span>
        </span>
      );
    case 'Baja':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Baja</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30 shrink-0">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span>{prioridad}</span>
        </span>
      );
  }
}

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
  const advanceTranslateX = useTransform(x, [15, 65], [-8, 6]);
  const backtrackTranslateX = useTransform(x, [-65, -15], [-6, 8]);

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

  const stationConfig = getStationConfig(tarea.partida);
  const StationIcon = stationConfig.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 dark:border-slate-700/60 bg-stone-900 dark:bg-slate-950 mb-3 select-none shadow-md shadow-amber-900/5 dark:shadow-black/30">
      {/* Background Underlay 1: Advance (Right Swipe) - ONLY rendered if canAdvance */}
      {canAdvance && (
        <motion.div 
          style={{ opacity: advanceOpacity }}
          className="absolute inset-0 flex items-center justify-start pl-5 sm:pl-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold pointer-events-none z-0 shadow-inner"
        >
          <motion.div 
            style={{ scale: advanceScale, x: advanceTranslateX }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-sm">
              <ArrowRight className="w-5 h-5 stroke-[3] text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[0.65rem] uppercase font-black tracking-widest text-emerald-100 drop-shadow-xs">Avanzar</span>
              <span className="text-sm font-black uppercase tracking-tight text-white">{nextState}</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Background Underlay 2: Backtrack (Left Swipe) - ONLY rendered if canBacktrack */}
      {canBacktrack && (
        <motion.div 
          style={{ opacity: backtrackOpacity }}
          className="absolute inset-0 flex items-center justify-end pr-5 sm:pr-6 bg-gradient-to-l from-sky-600 via-blue-600 to-indigo-600 text-white font-bold pointer-events-none z-0 shadow-inner"
        >
          <motion.div 
            style={{ scale: backtrackScale, x: backtrackTranslateX }}
            className="flex items-center gap-2.5"
          >
            <div className="flex flex-col text-right">
              <span className="text-[0.65rem] uppercase font-black tracking-widest text-sky-100 drop-shadow-xs">Retroceder</span>
              <span className="text-sm font-black uppercase tracking-tight text-white">{prevState}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-sm">
              <ArrowLeft className="w-5 h-5 stroke-[3] text-white" />
            </div>
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
        className="relative z-10 bg-white dark:bg-slate-800/95 p-4 sm:p-5 flex flex-col gap-3.5"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[0.65rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${stationConfig.card.tag}`}>
                <StationIcon className="w-3 h-3 stroke-[2.2]" />
                <span>{tarea.partida}</span>
              </span>
            </div>
            <h4 className="font-bold text-stone-900 dark:text-white text-lg sm:text-xl leading-snug tracking-tight">
              {tarea.nombre}
            </h4>
          </div>
          <PriorityBeaconBadge prioridad={tarea.prioridad} />
        </div>

        {/* Quantities & Status Info */}
        <div className="flex justify-between items-center bg-stone-100/80 dark:bg-slate-900/70 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-slate-700/50 shadow-inner">
          <div className="flex items-center gap-1 text-stone-900 dark:text-slate-100 font-black text-lg">
            <span className="text-amber-500 text-xl font-bold">#</span>
            <span>{tarea.cantidad}</span>
            <span className="text-xs uppercase font-semibold text-stone-500 dark:text-slate-400 tracking-wider ml-1">{tarea.unidad}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-slate-800 text-stone-800 dark:text-amber-400 border border-stone-300 dark:border-slate-700/60 shadow-xs">
            {tarea.estado}
          </span>
        </div>

        {/* Tactile Touch Action Bar (min-h-[48px] touch targets) */}
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-slate-700/50"
        >
          {/* Backtrack button */}
          {canBacktrack && prevState ? (
            <button
              type="button"
              onClick={() => moverTarea(tarea.id, prevState)}
              className="min-h-[48px] min-w-[48px] p-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-xl text-stone-900 dark:text-slate-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title={`Retroceder a ${prevState}`}
              aria-label={`Retroceder a ${prevState}`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span className="text-xs font-bold">{prevState}</span>
            </button>
          ) : (
            <div className="min-w-[48px]" />
          )}

          {/* Quick Shopping Button */}
          <ShoppingModal tarea={tarea} />

          {/* Advance button */}
          {canAdvance && nextState ? (
            <button
              type="button"
              onClick={() => moverTarea(tarea.id, nextState)}
              className="min-h-[48px] min-w-[48px] p-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 border border-amber-500/50 rounded-xl text-stone-950 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title={`Avanzar a ${nextState}`}
              aria-label={`Avanzar a ${nextState}`}
            >
              <span className="text-xs font-bold">{nextState}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <div className="min-w-[48px]" />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DesktopTaskCard({ tarea, index }: { tarea: Tarea; index: number }) {
  const stationConfig = getStationConfig(tarea.partida);
  const StationIcon = stationConfig.icon;

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
            className={`group rounded-2xl p-5 border transition-all duration-300 flex flex-col gap-3.5 select-none cursor-grab active:cursor-grabbing ${
              snapshot.isDragging 
                ? `${stationConfig.card.dragging} shadow-2xl rotate-1 scale-[1.02]`
                : `bg-white dark:bg-slate-800/90 border-stone-200/90 dark:border-slate-700/60 shadow-lg shadow-amber-900/5 dark:shadow-xl dark:shadow-black/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/10 dark:hover:shadow-black/60 ${stationConfig.card.hoverBorder}`
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 text-[0.65rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${stationConfig.card.tag}`}>
                    <StationIcon className="w-3 h-3 stroke-[2.2]" />
                    <span>{tarea.partida}</span>
                  </span>
                </div>
                <h4 className="font-bold text-stone-900 dark:text-white text-lg leading-tight tracking-tight group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  {tarea.nombre}
                </h4>
              </div>
              <PriorityBeaconBadge prioridad={tarea.prioridad} />
            </div>

            <div className="flex justify-between items-center mt-1 pt-3 border-t border-stone-100 dark:border-slate-700/50">
              <div className="text-base font-black text-stone-900 dark:text-slate-100 bg-stone-100/90 dark:bg-slate-900/70 px-3.5 py-1.5 rounded-xl border border-stone-300/80 dark:border-slate-700/50 flex items-center gap-1.5 shadow-inner">
                <span className="text-amber-500 font-bold">#</span>
                <span>{tarea.cantidad}</span>
                <span className="text-xs uppercase font-semibold text-stone-500 dark:text-slate-400 tracking-wider ml-0.5">{tarea.unidad}</span>
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
