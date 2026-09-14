import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Trash2, Download, RotateCcw, Plus } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export function SidebarDrawer() {
  const [open, setOpen] = useState(false);
  const { partidas, agregarPartida, eliminarPartida, resetearTurno } = useBrigadeStore();
  const { isDark } = useTheme();
  
  const [nuevaPartida, setNuevaPartida] = useState('');

  const handleAddPartida = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPartida.trim()) {
      agregarPartida(nuevaPartida.trim());
      setNuevaPartida('');
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem('brigade-sync-store');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `misepro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button 
          className={`min-h-[48px] w-[48px] rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-slate-100 shadow-black/20'
              : 'bg-white hover:bg-stone-50 border-amber-900/15 text-stone-600 hover:text-stone-900 shadow-amber-900/5'
          }`}
          aria-label="Abrir menú principal"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm shadow-2xl focus:outline-none flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left border-r ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-slate-100' 
            : 'bg-stone-50 border-stone-200 text-stone-900'
        }`}>
          <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-slate-800">
            <Dialog.Title className="text-xl font-bold font-serif tracking-tight text-amber-500">
              MisePro Ajustes
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-stone-200 text-stone-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8">
            
            {/* Gestión de Partidas */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 dark:text-slate-500">Gestión de Partidas</h3>
              
              <ul className="flex flex-col gap-2">
                {partidas.map(p => (
                  <li key={p} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-white border-stone-200'}`}>
                    <span className="font-bold text-sm">{p}</span>
                    <button 
                      onClick={() => eliminarPartida(p)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar partida"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddPartida} className="flex gap-2 mt-1">
                <input 
                  type="text" 
                  value={nuevaPartida}
                  onChange={(e) => setNuevaPartida(e.target.value)}
                  placeholder="Nueva partida..."
                  className={`flex-1 min-h-[44px] px-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-700/60 text-slate-100 placeholder:text-slate-600' : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                  }`}
                />
                <button 
                  type="submit"
                  disabled={!nuevaPartida.trim()}
                  className="min-h-[44px] px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </form>
            </section>

            {/* Mantenimiento */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 dark:text-slate-500">Mantenimiento</h3>
              
              <button 
                onClick={handleExport}
                className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-bold transition-colors cursor-pointer text-left ${
                  isDark ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800 text-slate-200' : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-stone-100 text-amber-600'}`}>
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="uppercase tracking-wider text-xs font-black">Exportar Datos</div>
                  <div className="text-[0.65rem] font-medium opacity-70 mt-0.5">Descargar JSON de configuración</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas vaciar todas las tareas y reiniciar el turno?')) {
                    resetearTurno();
                    setOpen(false);
                  }
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-bold transition-colors cursor-pointer text-left ${
                  isDark ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 text-red-400' : 'bg-red-50 border-red-200 hover:bg-red-100 text-red-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-200/50'}`}>
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="uppercase tracking-wider text-xs font-black">Resetear Turno</div>
                  <div className="text-[0.65rem] font-medium opacity-70 mt-0.5">Eliminará todas las tareas actuales</div>
                </div>
              </button>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
