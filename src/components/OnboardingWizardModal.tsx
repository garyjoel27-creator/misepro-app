import { useState } from 'react';
import { ChefHat, Plus, X, ArrowRight, Check } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';

const COMMON_STATION_SUGGESTIONS = [
  'Plancha',
  'Parrilla / Brasa',
  'Frituras',
  'Cuarto Frío',
  'Pastelería / Postres',
  'Sushi / Crudos',
  'Pastería / Horno',
  'Ensaladas',
  'Arroces'
];

export function OnboardingWizardModal() {
  const { hasConfiguredOnboarding, finalizarOnboarding, nombreRestaurante } = useBrigadeStore();

  const [restaurantName, setRestaurantName] = useState(nombreRestaurante || 'Mi Cocina Pro');
  const [mode, setMode] = useState<'custom' | 'classic'>('custom');
  
  // Custom stations state
  const [customStations, setCustomStations] = useState<string[]>([
    'Plancha',
    'Cuarto Frío',
    'Postres'
  ]);
  const [newStationInput, setNewStationInput] = useState('');

  if (hasConfiguredOnboarding) return null;

  const handleAddCustomStation = (name: string) => {
    const clean = name.trim();
    if (clean && !customStations.some(s => s.toLowerCase() === clean.toLowerCase())) {
      setCustomStations([...customStations, clean]);
    }
  };

  const handleRemoveCustomStation = (name: string) => {
    setCustomStations(customStations.filter(s => s !== name));
  };

  const handleComplete = () => {
    if (mode === 'classic') {
      finalizarOnboarding(restaurantName, [], true);
    } else {
      const finalStations = customStations.length > 0 ? customStations : ['Cocina Principal'];
      finalizarOnboarding(restaurantName, finalStations, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-stone-900/95 to-[#080b12] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Brand Header */}
        <div className="text-center pb-5 border-b border-white/10">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
            <ChefHat className="w-8 h-8 stroke-[2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-amber-400">
            MISE·PRO
          </h1>
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold mt-1">
            Configuración Inicial de tu Cocina y Brigada
          </p>
        </div>

        <div className="space-y-6 my-6">
          {/* Nombre del Restaurante */}
          <div>
            <label className="text-xs uppercase font-bold text-stone-400 tracking-wider block mb-2">
              1. Nombre de tu Restaurante o Cocina:
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Ej: Restaurante El Faro, Asador Central, Bistro 9..."
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          {/* Opción de inicio */}
          <div>
            <label className="text-xs uppercase font-bold text-stone-400 tracking-wider block mb-3">
              2. ¿Cómo quieres estructurar tus partidas de trabajo?
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción 1: En Blanco / Personalizado */}
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  mode === 'custom'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">⚡</span>
                  {mode === 'custom' && <Check className="w-5 h-5 text-amber-400 stroke-[3]" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">
                    Empezar en Blanco
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Crea tus partidas a tu gusto (Plancha, Frituras, Cuarto Frío, etc.).
                  </p>
                </div>
              </button>

              {/* Opción 2: Plantilla Clásica */}
              <button
                type="button"
                onClick={() => setMode('classic')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  mode === 'classic'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🏛️</span>
                  {mode === 'classic' && <Check className="w-5 h-5 text-amber-400 stroke-[3]" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">
                    Plantilla Clásica
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Saucier, Garde Manger, Pescados y Carnes con tareas de ejemplo.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Builder de partidas si mode === 'custom' */}
          {mode === 'custom' && (
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-stone-300 block">
                Define las partidas de tu cocina:
              </span>

              {/* Input para agregar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStationInput}
                  onChange={(e) => setNewStationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newStationInput.trim()) {
                        handleAddCustomStation(newStationInput);
                        setNewStationInput('');
                      }
                    }
                  }}
                  placeholder="Escribe el nombre de la partida..."
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStationInput.trim()) {
                      handleAddCustomStation(newStationInput);
                      setNewStationInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </div>

              {/* Lista activa de partidas */}
              <div className="flex flex-wrap gap-2 pt-1">
                {customStations.map((station) => (
                  <span
                    key={station}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800 text-stone-100 border border-stone-700 text-xs font-bold shadow-xs"
                  >
                    <span>{station}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomStation(station)}
                      className="hover:text-red-400 p-0.5 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                {customStations.length === 0 && (
                  <p className="text-xs text-stone-500 italic py-1">
                    No has añadido partidas aún. Elige sugerencias abajo o escribe arriba.
                  </p>
                )}
              </div>

              {/* Sugerencias Rápidas de 1 Toque */}
              <div className="pt-2 border-t border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block mb-1.5">
                  Sugerencias Rápidas de Hostelería (Toca para agregar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_STATION_SUGGESTIONS.map((sug) => {
                    const exists = customStations.some(s => s.toLowerCase() === sug.toLowerCase());
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddCustomStation(sug)}
                        disabled={exists}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          exists
                            ? 'opacity-40 border-stone-800 bg-stone-900 text-stone-600 cursor-default'
                            : 'border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-400'
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleComplete}
          className="w-full min-h-[54px] rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition-transform active:scale-98"
        >
          <span>Comenzar en Mi Cocina</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

      </div>
    </div>
  );
}
