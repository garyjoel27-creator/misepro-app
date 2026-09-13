import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
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

  const handleIncrement = () => {
    setCantidad(prev => Number((prev + 1).toFixed(1)));
  };

  const handleDecrement = () => {
    setCantidad(prev => Math.max(0.5, Number((prev - 1).toFixed(1))));
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="min-h-[44px] min-w-[44px] p-2.5 bg-slate-100 hover:bg-amber-400 text-slate-900 hover:text-slate-950 border-2 border-slate-900 rounded-xl flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 active:bg-amber-500" 
          title="Añadir a lista de compras"
          aria-label={`Añadir ${tarea.nombre} a compras`}
        >
          <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[92vw] max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 sm:p-7 border-4 border-slate-900 focus:outline-none z-50 shadow-none">
          <div className="flex justify-between items-start mb-5 pb-3 border-b-2 border-slate-900">
            <div>
              <Dialog.Title className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                Añadir a Compras
              </Dialog.Title>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mt-0.5">
                Reaprovisionamiento Rápido
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-slate-900 bg-slate-100 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 stroke-[3]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            <div className="p-3.5 bg-slate-100 border-2 border-slate-900 rounded-xl">
              <span className="text-xs uppercase font-black text-slate-500 tracking-wider">Ingrediente / Preparación</span>
              <p className="text-xl font-black text-slate-950 mt-0.5 leading-tight">{tarea.nombre}</p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase font-black text-slate-800 tracking-wider">
                Cantidad a comprar ({tarea.unidad})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="min-h-[48px] min-w-[48px] bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border-2 border-slate-900 rounded-xl text-2xl font-black text-slate-900 flex items-center justify-center select-none transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <input 
                  type="number" 
                  value={cantidad} 
                  onChange={e => setCantidad(Number(e.target.value))} 
                  className="min-h-[48px] border-2 border-slate-900 p-2 text-center text-2xl font-black rounded-xl w-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  min={0.1}
                  step={0.5}
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="min-h-[48px] min-w-[48px] bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border-2 border-slate-900 rounded-xl text-2xl font-black text-slate-900 flex items-center justify-center select-none transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t-2 border-slate-900">
            <Dialog.Close asChild>
              <button 
                type="button"
                className="min-h-[44px] px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-black border-2 border-slate-900 transition-colors uppercase tracking-wider text-xs"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button 
              type="button"
              onClick={handleComprar}
              className="min-h-[44px] px-6 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl border-2 border-slate-900 transition-colors uppercase tracking-wider text-xs flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              Confirmar Compra
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
