import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Clock, Flame, CheckCircle2, Layers, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { TaskCard } from './TaskCard';
import { InlineQuickAdd } from './InlineQuickAdd';
import { getStationConfig } from '../types/stations';

interface KanbanBoardProps {
  partida: string;
  masterMode?: boolean;
}

const COLUMNS = ['Pendiente', 'En Proceso', 'Completado'] as const;
type MobileTab = (typeof COLUMNS)[number] | 'Todas';

/**
 * Ordena las elaboraciones para que lo pendiente/en proceso quede arriba
 * y lo finalizado baje suavemente al fondo sin desaparecer de la pantalla.
 */
function ordenarTareasInPlace(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    if (a.estado === 'Completado' && b.estado !== 'Completado') return 1;
    if (a.estado !== 'Completado' && b.estado === 'Completado') return -1;
    return 0;
  });
}

export function KanbanBoard({ partida, masterMode = false }: KanbanBoardProps) {
  const kanbanTareas = useBrigadeStore(state => state.kanbanTareas);
  const moverTarea = useBrigadeStore(state => state.moverTarea);
  const limpiarCompletadas = useBrigadeStore(state => state.limpiarCompletadas);
  const coloresPartidas = useBrigadeStore(state => state.coloresPartidas);
  const stationConfig = getStationConfig(partida, coloresPartidas[partida]);
  
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  // En móvil por defecto 'Todas' para que nada desaparezca al pulsar
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('Todas');

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const tareasDePartida = kanbanTareas.filter(t => t.partida === partida);
  const completadasCount = tareasDePartida.filter(t => t.estado === 'Completado').length;

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
      return ordenarTareasInPlace(tareasDePartida);
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

  // Master Mode: Lista vertical fluida para el Panel Maestro del Chef
  if (masterMode) {
    const sortedTasks = ordenarTareasInPlace(tareasDePartida);

    return (
      <div className="flex flex-col gap-2 w-full text-left">
        <InlineQuickAdd partida={partida} />

        {/* Barra de estado y botón Limpiar para el Chef */}
        {completadasCount > 0 && (
          <div className="flex items-center justify-between px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {completadasCount} terminada{completadasCount > 1 ? 's' : ''} al final
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Limpiar las ${completadasCount} tareas terminadas de ${partida}?`)) {
                  limpiarCompletadas(partida);
                }
              }}
              className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              title="Quitar las tareas finalizadas de la lista"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>
        )}

        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 opacity-60">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-stone-400 dark:text-slate-600" />
            <p className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">Todo listo</p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((tarea, index) => (
                <motion.div
                  key={tarea.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <TaskCard tarea={tarea} index={index} isMobile={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // Mobile View (< md / 768px): One-Hand Stacked Layout with Swipe gestures
  if (!isDesktop) {
    const filteredTasks = getFilteredMobileTasks();
    const pendientesCount = tareasDePartida.filter(t => t.estado === 'Pendiente').length;
    const enProcesoCount = tareasDePartida.filter(t => t.estado === 'En Proceso').length;
    const completadoCount = tareasDePartida.filter(t => t.estado === 'Completado').length;

    return (
      <div className="flex flex-col gap-4 w-full text-left">
        {/* Thumb-friendly Segmented Status Bar (min-h-[48px] touch targets) */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-stone-100 dark:bg-[#0f172a] border-2 border-stone-300 dark:border-slate-700 rounded-2xl shadow-md">
          <button
            type="button"
            onClick={() => setActiveMobileTab('Pendiente')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Pendiente'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-sm'
                : 'bg-white text-stone-700 dark:bg-[#1e293b] dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Pendiente')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Pend.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Pendiente' ? 'bg-stone-950 text-amber-400 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {pendientesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('En Proceso')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'En Proceso'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-sm'
                : 'bg-white text-stone-700 dark:bg-[#1e293b] dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('En Proceso')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Proc.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'En Proceso' ? 'bg-stone-950 text-amber-400 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {enProcesoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Completado')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Completado'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-sm'
                : 'bg-white text-stone-700 dark:bg-[#1e293b] dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Completado')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Listo</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Completado' ? 'bg-stone-950 text-amber-400 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {completadoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Todas')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-bold text-xs transition-all border cursor-pointer active:scale-95 ${
              activeMobileTab === 'Todas'
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-sm'
                : 'bg-white text-stone-700 dark:bg-[#1e293b] dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Todas')}
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">Todas</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Todas' ? 'bg-stone-950 text-amber-400 border-amber-400' : 'bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300 border-stone-300 dark:border-slate-700'
            }`}>
              {tareasDePartida.length}
            </span>
          </button>
        </div>

        {/* Informative Header */}
        <div className="flex items-center justify-between px-1 py-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">Vista:</span>
            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs ${stationConfig.column.countBadge}`}>
              {activeMobileTab} ({filteredTasks.length})
            </span>
          </div>

          {completadasCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Limpiar las ${completadasCount} tareas terminadas de ${partida}?`)) {
                  limpiarCompletadas(partida);
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Quitar las tareas finalizadas de la lista"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar ({completadasCount})</span>
            </button>
          )}
        </div>

        {/* Mobile Task Cards List - KDS Solid High Contrast Ticket */}
        <div className="pb-10 flex flex-col gap-3">
          {(activeMobileTab === 'Pendiente' || activeMobileTab === 'Todas') && (
            <InlineQuickAdd partida={partida} />
          )}

          <div className="rounded-2xl sm:rounded-3xl border-2 border-stone-300 dark:border-slate-700 bg-white dark:bg-[#0f172a] shadow-lg overflow-hidden">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-10 text-center flex flex-col items-center justify-center min-h-[180px]"
                >
                  <div className="w-12 h-12 mb-3 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-stone-400 dark:text-amber-400 stroke-[2]" />
                  </div>
                  <p className="font-serif text-lg font-bold tracking-wide text-stone-800 dark:text-slate-100">
                    Mise en place lista, Chef
                  </p>
                  <p className="text-[0.7rem] text-stone-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">
                    {activeMobileTab === 'Todas' ? 'Sin tareas asignadas' : `0 tareas en ${activeMobileTab}`}
                  </p>
                </motion.div>
              ) : (
                filteredTasks.map((tarea, index) => (
                  <motion.div
                    key={tarea.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TaskCard tarea={tarea} index={index} isMobile={true} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // Desktop / Tablet (>= md / 768px): 3-Column Drag-and-Drop View (KDS Chef Board)
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full text-left">
        {COLUMNS.map(columnId => {
          const tareasInColumn = tareasDePartida.filter(t => t.estado === columnId);
          
          return (
            <div 
              key={columnId} 
              className={`flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-2xl border-2 border-stone-300 dark:border-slate-700 overflow-hidden shadow-xl min-h-[480px] md:min-h-[550px] transition-all duration-300 ${stationConfig.column.borderAccent}`}
            >
              <div className="p-4 border-b-2 border-stone-300 dark:border-slate-700 bg-stone-100 dark:bg-[#1e293b] flex items-center justify-between">
                <h3 className="font-black text-stone-900 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
                  <span className={stationConfig.column.headerIcon}>
                    {getStatusIcon(columnId)}
                  </span>
                  <span>{columnId}</span>
                </h3>
                <div className="flex items-center gap-2">
                  {columnId === 'Completado' && tareasInColumn.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Limpiar las ${tareasInColumn.length} tareas terminadas de ${partida}?`)) {
                          limpiarCompletadas(partida);
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 px-2 py-0.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Limpiar completadas"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                  <span className={`font-black text-xs py-0.5 px-2.5 rounded-full ${stationConfig.column.countBadge}`}>
                    {tareasInColumn.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3.5 overflow-y-auto min-h-[360px] bg-white dark:bg-[#0f172a] transition-all duration-200 rounded-b-2xl ${
                      snapshot.isDraggingOver 
                        ? `${stationConfig.column.dragOver} shadow-inner`
                        : 'bg-transparent'
                    }`}
                  >
                    {columnId === 'Pendiente' && <InlineQuickAdd partida={partida} />}
                    {tareasInColumn.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] opacity-70 pointer-events-none mt-4">
                        <CheckCircle2 className="w-8 h-8 text-stone-300 dark:text-slate-600 mb-3 stroke-[1.5]" />
                        <p className="font-serif text-base tracking-wide text-stone-500 dark:text-slate-400">
                          Mise en place lista, Chef
                        </p>
                      </div>
                    ) : (
                      tareasInColumn.map((tarea, index) => (
                        <TaskCard key={tarea.id} tarea={tarea} index={index} isMobile={false} />
                      ))
                    )}
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
