import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  Settings, 
  X, 
  Plus, 
  Trash2, 
  Pencil, 
  Check, 
  Download, 
  Upload, 
  RotateCcw,
  Save
} from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';
import { STATION_COLOR_THEMES, COLOR_THEME_LABELS, type StationColorKey } from '../types/stations';

interface StationManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StationManagerModal({ open, onOpenChange }: StationManagerModalProps) {
  const { isDark } = useTheme();
  const {
    partidas,
    coloresPartidas,
    nombreRestaurante,
    setNombreRestaurante,
    agregarPartida,
    renombrarPartida,
    setColorPartida,
    eliminarPartida,
    vaciarTodasLasPartidas,
    cargarPlantillaClasica,
    reiniciarOnboarding,
    exportarConfiguracionJSON,
    importarConfiguracionJSON,
    kanbanTareas
  } = useBrigadeStore();

  const [newStationName, setNewStationName] = useState('');
  const [newStationColor, setNewStationColor] = useState<StationColorKey>('amber');
  
  // Editing station inline
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editStationName, setEditStationName] = useState('');

  // Restaurant name state
  const [restName, setRestName] = useState(nombreRestaurante || 'Mi Cocina Pro');
  const [saveFeedback, setSaveFeedback] = useState(false);

  useEffect(() => {
    if (open) {
      setRestName(nombreRestaurante || 'Mi Cocina Pro');
    }
  }, [open, nombreRestaurante]);

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleAddPartida = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newStationName.trim();
    if (clean) {
      agregarPartida(clean, newStationColor);
      setNewStationName('');
    }
  };

  const handleSaveRename = (oldName: string) => {
    const clean = editStationName.trim();
    if (clean && clean !== oldName) {
      renombrarPartida(oldName, clean);
    }
    setEditingStation(null);
  };

  const handleExport = () => {
    const json = exportarConfiguracionJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misepro-config-${restName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importarConfiguracionJSON(content);
        if (result.success) {
          setImportStatus('¡Configuración importada con éxito!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus(`Error: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const colorKeys: StationColorKey[] = ['amber', 'emerald', 'sky', 'red', 'purple', 'orange'];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-3xl p-5 sm:p-7 shadow-2xl focus:outline-none flex flex-col max-h-[90vh] overflow-y-auto border ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-black/60' 
            : 'bg-white border-stone-200 text-stone-900 shadow-stone-900/10'
        }`}>
          
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Settings className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-serif font-bold text-amber-500">
                  Gestión de Partidas y Cocina
                </Dialog.Title>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Crea, personaliza o restablece tus partidas
                </p>
              </div>
            </div>

            <Dialog.Close asChild>
              <button className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-stone-100 text-stone-500'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6 py-4">
            
            {/* Restaurant Name Section */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-50 border-stone-200'
            }`}>
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400 block mb-1.5">
                Nombre del Establecimiento / Restaurante:
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={restName}
                  onChange={(e) => {
                    setRestName(e.target.value);
                  }}
                  onBlur={() => {
                    if (restName.trim()) {
                      setNombreRestaurante(restName.trim());
                    }
                  }}
                  placeholder="ej. Asador Don Manuel"
                  className="flex-1 bg-white dark:bg-slate-950 border border-amber-500/60 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-bold text-amber-500 font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (restName.trim()) {
                      setNombreRestaurante(restName.trim());
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  Fijar
                </button>
              </div>
            </div>

            {/* List of Current Stations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-slate-500">
                  Partidas Actuales ({partidas.length}):
                </span>
                {partidas.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de que deseas vaciar todas las partidas y dejar la cocina en blanco?")) {
                        vaciarTodasLasPartidas();
                      }
                    }}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar todas</span>
                  </button>
                )}
              </div>

              {partidas.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-stone-700 bg-stone-900/30">
                  <p className="text-sm font-bold text-stone-400">
                    No tienes ninguna partida creada
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Crea una con el formulario inferior o carga la plantilla clásica.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {partidas.map((partida) => {
                    const taskCount = kanbanTareas.filter(t => t.partida === partida).length;
                    const colorKey = (coloresPartidas[partida] as StationColorKey) || 'amber';
                    const isEditing = editingStation === partida;

                    return (
                      <div
                        key={partida}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-stone-200'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editStationName}
                              onChange={(e) => setEditStationName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(partida);
                              }}
                              className="flex-1 bg-white dark:bg-slate-950 border border-amber-500 rounded-xl px-2.5 py-1 text-sm font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(partida)}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white cursor-pointer"
                              title="Guardar nombre"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingStation(null)}
                              className="p-1.5 rounded-lg bg-stone-700 text-stone-300 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Color Selector Dropdown / Dot */}
                            <div className="relative group">
                              <span 
                                className="w-4 h-4 rounded-full inline-block shrink-0 shadow-sm ring-2 ring-black/20"
                                style={{ backgroundColor: STATION_COLOR_THEMES[colorKey]?.primaryColor || '#f59e0b' }}
                              />
                            </div>

                            <div className="min-w-0">
                              <span className="font-bold text-sm truncate block leading-tight">
                                {partida}
                              </span>
                              <span className="text-[10px] text-stone-400 font-semibold">
                                {taskCount} {taskCount === 1 ? 'elaboración' : 'elaboraciones'}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Color switcher */}
                            <div className="flex items-center gap-1">
                              {colorKeys.map((ck) => (
                                <button
                                  key={ck}
                                  type="button"
                                  onClick={() => setColorPartida(partida, ck)}
                                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                    colorKey === ck ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: STATION_COLOR_THEMES[ck].primaryColor }}
                                  title={`Color: ${COLOR_THEME_LABELS[ck]}`}
                                />
                              ))}
                            </div>

                            {/* Rename button */}
                            <button
                              onClick={() => {
                                setEditingStation(partida);
                                setEditStationName(partida);
                              }}
                              className="p-1.5 rounded-lg hover:bg-stone-700/50 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Renombrar partida"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => {
                                if (taskCount > 0) {
                                  if (!confirm(`La partida "${partida}" tiene ${taskCount} tareas asociadas. ¿Seguro que deseas eliminarla?`)) {
                                    return;
                                  }
                                }
                                eliminarPartida(partida);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar partida"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Station Form */}
            <form onSubmit={handleAddPartida} className="p-4 rounded-2xl border border-stone-800 bg-stone-900/40 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-stone-300 block">
                + Añadir Nueva Partida
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="Nombre: ej. Plancha, Pastelería, Sushi..."
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  disabled={!newStationName.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Color picker for the new station */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-stone-400">Color distintivo:</span>
                <div className="flex items-center gap-2">
                  {colorKeys.map((ck) => (
                    <button
                      key={ck}
                      type="button"
                      onClick={() => setNewStationColor(ck)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                        newStationColor === ck ? 'scale-125 ring-2 ring-white shadow-md' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: STATION_COLOR_THEMES[ck].primaryColor }}
                      title={COLOR_THEME_LABELS[ck]}
                    />
                  ))}
                </div>
              </div>
            </form>

            {/* Template Restoration & Onboarding Trigger */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Cargar las 4 partidas clásicas (Saucier, Garde Manger, Pescados, Carnes)?")) {
                    cargarPlantillaClasica();
                  }
                }}
                className="p-3 rounded-xl border border-stone-700 bg-stone-800/60 hover:bg-stone-800 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>🏛️ Plantilla Clásica</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  reiniciarOnboarding();
                  onOpenChange(false);
                }}
                className="p-3 rounded-xl border border-stone-700 bg-stone-800/60 hover:bg-stone-800 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Asistente Inicial</span>
              </button>
            </div>

            {/* Export / Import Section */}
            <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900/80 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                📦 Respaldo y Compartir con la Brigada
              </span>
              <p className="text-[11px] text-stone-400 leading-tight">
                Exporta la configuración de partidas y procesos para cargarla en las tablets y móviles del resto del equipo.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar (JSON)</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </div>

              {importStatus && (
                <div className="text-center text-xs font-bold py-1 text-emerald-400">
                  {importStatus}
                </div>
              )}
            </div>

            {/* Primary Save & Close Action */}
            <div className="pt-2 sticky bottom-0 bg-gradient-to-t from-white dark:from-slate-950 via-white/90 dark:via-slate-950/90 to-transparent pb-1">
              <button
                type="button"
                onClick={() => {
                  if (restName.trim()) {
                    setNombreRestaurante(restName.trim());
                  }
                  setSaveFeedback(true);
                  setTimeout(() => {
                    setSaveFeedback(false);
                    onOpenChange(false);
                  }, 600);
                }}
                className={`w-full min-h-[48px] px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                  saveFeedback 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                }`}
              >
                {saveFeedback ? <Check className="w-5 h-5 stroke-[3]" /> : <Save className="w-5 h-5" />}
                <span>{saveFeedback ? '¡Configuración Guardada!' : 'Guardar y Aplicar Configuración'}</span>
              </button>
            </div>

          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
