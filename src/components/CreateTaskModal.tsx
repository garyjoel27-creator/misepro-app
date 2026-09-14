import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import type { Tarea } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

interface CreateTaskModalProps {
  partidaActual: string;
}

export function CreateTaskModal({ partidaActual }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const { isDark } = useTheme();
  const { partidas, agregarTarea } = useBrigadeStore();

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [unidad, setUnidad] = useState('Kg');
  const [prioridad, setPrioridad] = useState<Tarea['prioridad']>('Media');
  const [partida, setPartida] = useState(partidaActual);
  const [diasVida, setDiasVida] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    let fechaCaducidad;
    if (diasVida !== '' && diasVida >= 0) {
      const date = new Date();
      date.setDate(date.getDate() + Number(diasVida));
      fechaCaducidad = date.toISOString().split('T')[0];
    }

    agregarTarea({
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      cantidad,
      unidad,
      prioridad,
      estado: 'Pendiente',
      partida,
      fechaCaducidad
    });

    setNombre('');
    setCantidad(1);
    setDiasVida('');
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) setPartida(partidaActual);
    }}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 shadow-xl shadow-amber-500/20 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-500/50"
          aria-label="Crear nueva tarea"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] border max-h-[90vh] overflow-y-auto ${
          isDark 
            ? 'bg-slate-900 border-slate-700/60 text-slate-100 shadow-black/50' 
            : 'bg-white border-stone-200 text-stone-900 shadow-stone-900/10'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-xl font-bold font-serif tracking-tight">
              Añadir Preparación
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-stone-100 text-stone-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Nombre de Preparación
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Fondo Oscuro, Salsa Bearnesa..."
                className={`min-h-[48px] px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark 
                    ? 'bg-slate-950/50 border-slate-700/60 text-slate-100 placeholder:text-slate-600' 
                    : 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Cantidad
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Unidad
                </label>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                >
                  <option value="Kg">Kg</option>
                  <option value="Litros">Litros</option>
                  <option value="Unidades">Unidades</option>
                  <option value="Raciones">Raciones</option>
                  <option value="Bandejas">Bandejas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Partida
                </label>
                <select
                  value={partida}
                  onChange={(e) => setPartida(e.target.value)}
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                >
                  {partidas.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Días de vida (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={diasVida}
                  onChange={(e) => setDiasVida(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0 = Hoy"
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Prioridad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Baja', 'Media', 'Critica'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrioridad(p)}
                    className={`min-h-[40px] rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      prioridad === p
                        ? p === 'Critica' 
                          ? 'bg-red-500 text-white border-red-600'
                          : p === 'Media'
                            ? 'bg-amber-500 text-stone-950 border-amber-600'
                            : 'bg-emerald-500 text-white border-emerald-600'
                        : isDark
                          ? 'bg-slate-950/50 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                          : 'bg-stone-50 border-stone-300 text-stone-500 hover:border-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    {p === 'Critica' ? 'Crítica' : p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 min-h-[56px] bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-wider rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-amber-500/50 cursor-pointer"
            >
              Añadir Tarea
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
