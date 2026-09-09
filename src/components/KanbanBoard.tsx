import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  partida: string;
}

const COLUMNS = ['Pendiente', 'En Proceso', 'Completado'] as const;

export function KanbanBoard({ partida }: KanbanBoardProps) {
  const kanbanTareas = useBrigadeStore(state => state.kanbanTareas);
  const moverTarea = useBrigadeStore(state => state.moverTarea);

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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden w-full text-left">
        {COLUMNS.map(columnId => {
          const tareasInColumn = tareasDePartida.filter(t => t.estado === columnId);
          
          return (
            <div key={columnId} className="flex flex-col h-full bg-slate-50 rounded-xl shadow-inner border border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-100/50 rounded-t-xl">
                <h3 className="font-semibold text-slate-700 flex items-center justify-between">
                  {columnId}
                  <span className="bg-white text-slate-500 text-sm py-0.5 px-2.5 rounded-full border border-slate-200 shadow-sm">
                    {tareasInColumn.length}
                  </span>
                </h3>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 overflow-y-auto min-h-[300px] transition-colors rounded-b-xl ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {tareasInColumn.map((tarea, index) => (
                      <TaskCard key={tarea.id} tarea={tarea} index={index} />
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
