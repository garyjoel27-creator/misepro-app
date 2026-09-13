import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Clock, Flame, CheckCircle2, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { TaskCard } from './TaskCard';
import { getStationConfig } from '../types/stations';

interface KanbanBoardProps {
  partida: string;
}

const COLUMNS = ['Pendiente', 'En Proceso', 'Completado'] as const;
type MobileTab = (typeof COLUMNS)[number] | 'Todas';

export function KanbanBoard({ partida }: KanbanBoardProps) {
  const kanbanTareas = useBrigadeStore(state => state.kanbanTareas);
  const moverTarea = useBrigadeStore(state => state.moverTarea);
  const stationConfig = getStationConfig(partida);
  
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('Pendiente');

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const tareasDePartida = kanbanTareas.filter(t => t.partida === partida);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moverTarea(draggableId, destination.droppableId as Tarea['estado']);
  };

  const getFilteredMobileTasks = () => {
    if (activeMobileTab === 'Todas') {
      return tareasDePartida;
    }
    return tareasDePartida.filter(t => t.estado === activeMobileTab);
  };

  const getStatusIcon = (status: MobileTab) => {
    switch (status) {
      case 'Pendiente':
        return <Clock className="w-4 h-4 stroke-[2.5]" />;
      case 'En Proceso':
        return <Flame className="w-4 h-4 stroke-[2.5]" />;
      case 'Completado':
        return <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />;
      case 'Todas':
        return <Layers className="w-4 h-4 stroke-[2.5]" />;
    }
  };

  // Mobile View (< md / 768px): One-Hand Stacked Layout with Swipe gestures
  if (!isDesktop) {
    const filteredTasks = getFilteredMobileTasks();
    const pendientesCount = tareasDePartida.filter(t => t.estado === 'Pendiente').length;
    const enProcesoCount = tareasDePartida.filter(t => t.estado === 'En Proceso').length;
    const completadoCount = tareasDePartida.filter(t => t.estado === 'Completado').length;

    return (
      <div className="flex flex-col gap-4 w-full text-left">
        {/* Thumb-friendly Segmented Status Bar (min-h-[48px] touch targets) */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-stone-200/60 dark:bg-slate-900/80 border border-stone-300 dark:border-slate-800 rounded-2xl backdrop-blur-md shadow-md">
          <button
            type="button"
            onClick={() => setActiveMobileTab('Pendiente')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Pendiente'
                ? 'bg-stone-900 text-amber-400 dark:bg-slate-950 dark:text-amber-400 border-amber-500/50 shadow-sm'
                : 'bg-white/80 text-stone-700 dark:bg-slate-850 dark:text-slate-400 border-stone-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Pendiente')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Pend.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-bold border ${
              activeMobileTab === 'Pendiente' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {pendientesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('En Proceso')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'En Proceso'
                ? 'bg-stone-900 text-amber-400 dark:bg-slate-950 dark:text-amber-400 border-amber-500/50 shadow-sm'
                : 'bg-white/80 text-stone-700 dark:bg-slate-850 dark:text-slate-400 border-stone-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('En Proceso')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Proc.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-bold border ${
              activeMobileTab === 'En Proceso' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {enProcesoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Completado')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Completado'
                ? 'bg-stone-900 text-amber-400 dark:bg-slate-950 dark:text-amber-400 border-amber-500/50 shadow-sm'
                : 'bg-white/80 text-stone-700 dark:bg-slate-850 dark:text-slate-400 border-stone-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Completado')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Listo</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-bold border ${
              activeMobileTab === 'Completado' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {completadoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Todas')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Todas'
                ? 'bg-stone-900 text-amber-400 dark:bg-slate-950 dark:text-amber-400 border-amber-500/50 shadow-sm'
                : 'bg-white/80 text-stone-700 dark:bg-slate-850 dark:text-slate-400 border-stone-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Todas')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Todas</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-bold border ${
              activeMobileTab === 'Todas' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {tareasDePartida.length}
            </span>
          </button>
        </div>

        {/* Informative Header & Gesture Help */}
        <div className="flex items-center justify-between px-1 py-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">Vista:</span>
            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs ${stationConfig.column.countBadge}`}>
              {activeMobileTab} ({filteredTasks.length})
            </span>
          </div>
          <div className="px-2.5 py-1 bg-stone-100 dark:bg-slate-900/80 border border-stone-300 dark:border-slate-800 rounded-xl text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-400 shadow-xs">
            ↔ Desliza para mover
          </div>
        </div>

        {/* Mobile Task Cards List with PopLayout exit animation */}
        <div className="space-y-3 pb-10">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 text-center bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-stone-200/90 dark:border-slate-800 rounded-2xl shadow-sm"
              >
                <p className="font-bold text-stone-900 dark:text-white uppercase tracking-wide text-sm">
                  No hay preparaciones en {activeMobileTab}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-1">
                  Usa los gestos de deslizamiento o pestañas para gestionar tareas.
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((tarea, index) => (
                <motion.div
                  key={tarea.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard tarea={tarea} index={index} isMobile={true} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Desktop / Tablet (>= md / 768px): 3-Column Drag-and-Drop View
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full text-left">
        {COLUMNS.map(columnId => {
          const tareasInColumn = tareasDePartida.filter(t => t.estado === columnId);
          
          return (
            <div 
              key={columnId} 
              className={`flex flex-col h-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-stone-200/90 dark:border-slate-800/80 overflow-hidden shadow-lg shadow-amber-900/5 dark:shadow-xl dark:shadow-black/40 min-h-[480px] md:min-h-[550px] transition-all duration-300 ${stationConfig.column.borderAccent}`}
            >
              <div className="p-4 border-b border-stone-200/80 dark:border-slate-800/80 bg-stone-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                <h3 className="font-bold text-stone-900 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
                  <span className={stationConfig.column.headerIcon}>
                    {getStatusIcon(columnId)}
                  </span>
                  <span>{columnId}</span>
                </h3>
                <span className={`font-black text-xs py-0.5 px-2.5 rounded-full ${stationConfig.column.countBadge}`}>
                  {tareasInColumn.length}
                </span>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 overflow-y-auto min-h-[360px] transition-all duration-200 rounded-b-2xl ${
                      snapshot.isDraggingOver 
                        ? `${stationConfig.column.dragOver} backdrop-blur-sm shadow-inner`
                        : 'bg-transparent'
                    }`}
                  >
                    {tareasInColumn.map((tarea, index) => (
                      <TaskCard key={tarea.id} tarea={tarea} index={index} isMobile={false} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
