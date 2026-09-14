import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';

interface ShoppingModalProps {
  tarea: Tarea;
  compact?: boolean;
}

export function ShoppingModal({ tarea, compact = false }: ShoppingModalProps) {
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
          className={
            compact
              ? "p-1.5 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
              : "min-h-[48px] min-w-[48px] p-3 bg-stone-100 hover:bg-amber-400/20 dark:bg-slate-800/80 dark:hover:bg-amber-400/20 text-stone-700 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 border border-stone-300 dark:border-slate-700/60 hover:border-amber-500/40 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer"
          } 
          title="Añadir a lista de compras"
          aria-label={`Añadir ${tarea.nombre} a compras`}
        >
          <ShoppingCart className={compact ? "w-4 h-4 stroke-[2]" : "w-5 h-5 stroke-[2.5]"} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 backdrop-blur-lg" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[92vw] max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-7 border border-stone-200/90 dark:border-slate-700/60 focus:outline-none z-50 shadow-2xl shadow-black/50">
          <div className="flex justify-between items-start mb-5 pb-3 border-b border-stone-200 dark:border-slate-800">
            <div>
              <Dialog.Title className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                Añadir a Compras
              </Dialog.Title>
              <p className="text-xs uppercase font-semibold text-stone-500 dark:text-slate-400 tracking-wider mt-0.5">
                Reaprovisionamiento Rápido
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="min-h-[48px] min-w-[48px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-100 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:hover:bg-red-500 text-stone-700 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 stroke-[3]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            <div className="p-3.5 bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-inner">
              <span className="text-xs uppercase font-bold text-stone-500 dark:text-slate-400 tracking-wider">Ingrediente / Preparación</span>
              <p className="text-xl font-bold text-stone-900 dark:text-white mt-0.5 leading-tight">{tarea.nombre}</p>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase font-bold text-stone-700 dark:text-slate-300 tracking-wider">
                Cantidad a comprar ({tarea.unidad})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="min-h-[48px] min-w-[48px] bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-xl text-2xl font-bold text-stone-800 dark:text-slate-200 flex items-center justify-center select-none transition-colors shadow-sm cursor-pointer"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <input 
                  type="number" 
                  value={cantidad} 
                  onChange={e => setCantidad(Number(e.target.value))} 
                  className="min-h-[48px] border border-stone-300 dark:border-slate-700 p-2 text-center text-2xl font-bold rounded-xl w-full bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                  min={0.1}
                  step={0.5}
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="min-h-[48px] min-w-[48px] bg-stone-100 hover:bg-stone-200 active:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 rounded-xl text-2xl font-bold text-stone-800 dark:text-slate-200 flex items-center justify-center select-none transition-colors shadow-sm cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-stone-200 dark:border-slate-800">
            <Dialog.Close asChild>
              <button 
                type="button"
                className="min-h-[48px] px-6 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl font-bold border border-stone-300 dark:border-slate-700 transition-colors uppercase tracking-wider text-xs shadow-sm cursor-pointer flex items-center justify-center"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button 
              type="button"
              onClick={handleComprar}
              className="min-h-[48px] px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 text-stone-950 font-bold rounded-xl border border-amber-300/50 transition-colors uppercase tracking-wider text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
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
