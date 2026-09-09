import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import type { Tarea } from '../store/useBrigadeStore';
import { ShoppingModal } from './ShoppingModal';

interface TaskCardProps {
  tarea: Tarea;
  index: number;
}

const getPriorityColor = (prioridad: string) => {
  switch (prioridad) {
    case 'Critica': return 'bg-red-100 text-red-800 border-red-200';
    case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Baja': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export function TaskCard({ tarea, index }: TaskCardProps) {
  return (
    <Draggable draggableId={tarea.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
          className="mb-3 outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex flex-col gap-2 transition-shadow ${
              snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500/50 rotate-2' : 'hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-medium text-slate-900 leading-tight">{tarea.nombre}</h4>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(tarea.prioridad)}`}>
                {tarea.prioridad}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-slate-600 font-medium">
                {tarea.cantidad} {tarea.unidad}
              </div>
              {/* The One-Click shopping modal */}
              <ShoppingModal tarea={tarea} />
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}
