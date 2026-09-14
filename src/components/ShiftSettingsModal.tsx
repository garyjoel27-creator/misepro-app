import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export function ShiftSettingsModal() {
  const [open, setOpen] = useState(false);
  const { turnoActual, setTurnoActual } = useBrigadeStore();
  const { isDark } = useTheme();

  const [nombreServicio, setNombreServicio] = useState(turnoActual.nombreServicio);
  const [comensales, setComensales] = useState(turnoActual.comensales);
  const [horaPase, setHoraPase] = useState(turnoActual.horaPase || '20:30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTurnoActual({ nombreServicio, comensales, horaPase });
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setNombreServicio(turnoActual.nombreServicio);
        setComensales(turnoActual.comensales);
        setHoraPase(turnoActual.horaPase || '20:30');
      }
    }}>
      <Dialog.Trigger asChild>
        <button 
          className={`min-h-[48px] w-[48px] rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-slate-100 shadow-black/20'
              : 'bg-white hover:bg-stone-50 border-amber-900/15 text-stone-600 hover:text-stone-900 shadow-amber-900/5'
          }`}
          aria-label="Configuración de Turno"
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-2xl p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] border ${
          isDark 
            ? 'bg-slate-900 border-slate-700/60 text-slate-100 shadow-black/50' 
            : 'bg-white border-stone-200 text-stone-900 shadow-stone-900/10'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-xl font-bold font-serif tracking-tight">
              Ajustes del Turno
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
                Servicio
              </label>
              <select
                value={nombreServicio}
                onChange={(e) => setNombreServicio(e.target.value)}
                className={`min-h-[48px] px-4 rounded-xl border text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark 
                    ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                    : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              >
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Cena">Cena</option>
                <option value="Evento/Banquetes">Evento/Banquetes</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Comensales (PAX)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={comensales}
                  onChange={(e) => setComensales(Number(e.target.value))}
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Hora del Pase
                </label>
                <input
                  type="time"
                  required
                  value={horaPase}
                  onChange={(e) => setHoraPase(e.target.value)}
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark 
                      ? 'bg-slate-950/50 border-slate-700/60 text-slate-100' 
                      : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 min-h-[56px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-950 font-black uppercase tracking-wider rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-amber-500/50 cursor-pointer"
            >
              Guardar Ajustes
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
