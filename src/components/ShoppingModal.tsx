import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ShoppingCart, X } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';

interface ShoppingModalProps {
  tarea: Tarea;
}

export function ShoppingModal({ tarea }: ShoppingModalProps) {
  const [open, setOpen] = useState(false);
  const [cantidad, setCantidad] = useState(tarea.cantidad);
  const agregarCompra = useBrigadeStore(state => state.agregarCompra);

  const handleComprar = () => {
    if (cantidad <= 0) return;
    agregarCompra({
      id: Date.now().toString(),
      ingrediente: tarea.nombre,
      cantidad: cantidad,
      categoria: 'Vegetales' // default category
    });
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors" title="Añadir a Compras">
          <ShoppingCart size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none z-50">
          <Dialog.Title className="text-xl font-semibold mb-4 text-slate-900">
            Añadir Compra: {tarea.nombre}
          </Dialog.Title>
          <div className="mb-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Cantidad a comprar ({tarea.unidad})
              <input 
                type="number" 
                value={cantidad} 
                onChange={e => setCantidad(Number(e.target.value))} 
                className="border border-slate-300 p-2 rounded-md mt-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                step={0.1}
              />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium">
                Cancelar
              </button>
            </Dialog.Close>
            <button 
              onClick={handleComprar}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Añadir a lista
            </button>
          </div>
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
