import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Clock, Flame, CheckCircle2, Layers } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  partida: string;
}

const COLUMNS = ['Pendiente', 'En Proceso', 'Completado'] as const;
type MobileTab = (typeof COLUMNS)[number] | 'Todas';

export function KanbanBoard({ partida }: KanbanBoardProps) {
  const kanbanTareas = useBrigadeStore(state => state.kanbanTareas);
  const moverTarea = useBrigadeStore(state => state.moverTarea);
  
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
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-200 border-2 border-slate-900 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveMobileTab('Pendiente')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-black text-xs transition-all border-2 ${
              activeMobileTab === 'Pendiente'
                ? 'bg-slate-950 text-amber-400 border-slate-950'
                : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Pendiente')}
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">Pend.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Pendiente' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-100 text-slate-900 border-slate-900'
            }`}>
              {pendientesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('En Proceso')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-black text-xs transition-all border-2 ${
              activeMobileTab === 'En Proceso'
                ? 'bg-slate-950 text-amber-400 border-slate-950'
                : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('En Proceso')}
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">Proc.</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'En Proceso' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-100 text-slate-900 border-slate-900'
            }`}>
              {enProcesoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Completado')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-black text-xs transition-all border-2 ${
              activeMobileTab === 'Completado'
                ? 'bg-slate-950 text-amber-400 border-slate-950'
                : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Completado')}
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">Listo</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Completado' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-100 text-slate-900 border-slate-900'
            }`}>
              {completadoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('Todas')}
            className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl font-black text-xs transition-all border-2 ${
              activeMobileTab === 'Todas'
                ? 'bg-slate-950 text-amber-400 border-slate-950'
                : 'bg-white text-slate-900 border-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              {getStatusIcon('Todas')}
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">Todas</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-black border ${
              activeMobileTab === 'Todas' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-100 text-slate-900 border-slate-900'
            }`}>
              {tareasDePartida.length}
            </span>
          </button>
        </div>

        {/* Informative Header & Gesture Help */}
        <div className="flex items-center justify-between px-1 py-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider text-slate-600">Vista:</span>
            <span className="text-sm font-black text-slate-950 bg-amber-400 px-2.5 py-1 rounded-lg border-2 border-slate-900">
              {activeMobileTab} ({filteredTasks.length})
            </span>
          </div>
          <div className="px-2.5 py-1 bg-slate-200 border-2 border-slate-900 rounded-lg text-[0.65rem] sm:text-xs font-black uppercase tracking-wider text-slate-900">
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
                className="p-8 text-center bg-white border-2 border-slate-900 rounded-2xl"
              >
                <p className="font-black text-slate-900 uppercase tracking-wide text-sm">
                  No hay preparaciones en {activeMobileTab}
                </p>
                <p className="text-xs text-slate-600 font-bold mt-1">
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
              className="flex flex-col h-full bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-none min-h-[480px] md:min-h-[550px]"
            >
              <div className="p-4 border-b-2 border-slate-900 bg-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-950 uppercase tracking-wider text-base flex items-center gap-2">
                  {getStatusIcon(columnId)}
                  <span>{columnId}</span>
                </h3>
                <span className="bg-slate-900 text-amber-400 font-black text-xs py-1 px-3 rounded-full border-2 border-slate-900">
                  {tareasInColumn.length}
                </span>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 overflow-y-auto min-h-[360px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-amber-50/60' : 'bg-slate-50'
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

