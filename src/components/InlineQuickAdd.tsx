import { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Trash2, ChevronDown, Check } from 'lucide-react';
import { useBrigadeStore, type ProcesoHabitual } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export function InlineQuickAdd({ partida }: { partida: string }) {
  const { isDark } = useTheme();
  const { agregarTarea, procesosHabituales, eliminarProcesoHabitual } = useBrigadeStore();
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [showProcesos, setShowProcesos] = useState(false);
  const [addedProcId, setAddedProcId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const procesosDePartida = procesosHabituales.filter(p => p.partida === partida);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProcesos(false);
      }
    };
    if (showProcesos) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProcesos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    agregarTarea({
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      cantidad,
      unidad: 'Kg',
      prioridad: 'Media',
      estado: 'Pendiente',
      partida,
    });
    setNombre('');
    setCantidad(1);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }
  };

  const handleSelectProceso = (proc: ProcesoHabitual) => {
    agregarTarea({
      id: crypto.randomUUID(),
      nombre: proc.nombre,
      cantidad: proc.cantidadSugerida,
      unidad: proc.unidad,
      prioridad: proc.prioridad,
      estado: 'Pendiente',
      partida,
    });

    setAddedProcId(proc.id);
    setTimeout(() => setAddedProcId(null), 1000);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([25, 40]);
    }
  };

  return (
    <div className="relative mb-3 flex flex-col gap-2">
      {/* Botón rápido para desplegar catálogo de Procesos */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowProcesos(!showProcesos)}
            className={`min-h-[34px] px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              showProcesos
                ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                : isDark
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-amber-100/70 hover:bg-amber-200 text-amber-900 border-amber-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Procesos ({procesosDePartida.length})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProcesos ? 'rotate-180' : ''}`} />
          </button>

          {/* Menú flotante de Procesos Habituales */}
          {showProcesos && (
            <div className={`absolute top-full left-0 mt-1.5 w-72 sm:w-80 rounded-2xl border p-2 shadow-2xl z-40 backdrop-blur-2xl transition-all ${
              isDark
                ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-black/80'
                : 'bg-white/95 border-stone-200 text-stone-900 shadow-stone-900/20'
            }`}>
              <div className="p-2 border-b border-stone-200/50 dark:border-slate-800/60 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Procesos de {partida}
                  </h4>
                  <p className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">
                    Toca para añadir a la lista sin teclear
                  </p>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto flex flex-col gap-1 py-1.5">
                {procesosDePartida.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400 dark:text-slate-500">
                    No hay procesos guardados en esta partida. Pulsa la estrella ⭐ en cualquier tarea para guardarla aquí.
                  </div>
                ) : (
                  procesosDePartida.map(proc => {
                    const isJustAdded = addedProcId === proc.id;
                    return (
                      <div
                        key={proc.id}
                        className={`group flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-semibold transition-all ${
                          isJustAdded
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : isDark
                            ? 'hover:bg-slate-900 active:bg-slate-850 text-slate-200'
                            : 'hover:bg-amber-50 active:bg-amber-100 text-stone-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectProceso(proc)}
                          className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                        >
                          {isJustAdded ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0 stroke-[2.5]" />
                          )}
                          <span className="truncate">{proc.nombre}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono shrink-0">
                            {proc.cantidadSugerida}{proc.unidad.charAt(0)}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarProcesoHabitual(proc.id);
                          }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                          title="Eliminar de procesos habituales"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de añadir tarea ad-hoc */}
      <form onSubmit={handleSubmit} className={`flex flex-col gap-2 p-2 rounded-xl border shadow-sm ${
        isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-white/60 border-stone-200/80'
      }`}>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Escribir tarea nueva (ej. Cortar verduras)..."
          className={`w-full min-h-[40px] px-3 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
            isDark 
              ? 'bg-slate-950/50 border border-slate-800 text-slate-100 placeholder:text-slate-500' 
              : 'bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400'
          }`}
        />
        <div className="flex gap-2">
          <input
            type="number"
            required
            min="0.1"
            step="0.1"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className={`w-20 min-h-[40px] px-2 text-center rounded-lg text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              isDark 
                ? 'bg-slate-950/50 border border-slate-800 text-slate-100' 
                : 'bg-stone-50 border border-stone-200 text-stone-900'
            }`}
          />
          <button
            type="submit"
            disabled={!nombre.trim()}
            className="flex-1 min-h-[40px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:bg-stone-300 dark:disabled:bg-slate-700 text-stone-950 font-bold uppercase tracking-wider text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Añadir
          </button>
        </div>
      </form>
    </div>
  );
}
