import { useEffect, useState } from 'react';
import { useBrigadeStore } from './store/useBrigadeStore';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertCircle, Sparkles, Loader2, UtensilsCrossed, Sun, Moon } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { LogisticsDrawer } from './components/LogisticsDrawer';
import { useTheme } from './hooks/useTheme';
import { getStationConfig, type StationName } from './types/stations';

export default function App() {
  const { turnoActual, kanbanTareas, comprasPendientes, cargarDatos, analizarEscandallo, analizandoIA } = useBrigadeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stations: StationName[] = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#fcfaf6] text-stone-900'
    }`}>
      {/* Sticky Top Header - Luxury Executive Glassmorphic */}
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-300 ${
        isDark
          ? 'bg-slate-950/80 border-b border-slate-800/80 shadow-2xl shadow-black/40'
          : 'bg-stone-100/90 border-b border-amber-900/10 shadow-lg shadow-amber-900/5'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[72px] sm:h-20 flex items-center justify-between gap-2">
          {/* Brand & Shift Info */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-md ${
              isDark
                ? 'bg-amber-400/90 text-slate-950 border border-amber-300/40 shadow-amber-500/10'
                : 'bg-amber-500 text-stone-950 border border-amber-600/30 shadow-amber-900/10'
            }`}>
              <UtensilsCrossed className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-serif tracking-wide font-bold leading-none text-amber-500 dark:text-amber-400">
                  MisePro
                </h1>
                <span className={`hidden sm:inline-block text-[0.65rem] uppercase tracking-widest font-semibold ${
                  isDark ? 'text-slate-400' : 'text-stone-500'
                }`}>
                  Brigade Sync
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-serif tracking-wider font-semibold uppercase ${
                  isDark ? 'text-slate-300' : 'text-stone-700'
                }`}>
                  {turnoActual.nombreServicio}
                </span>
                <span className="text-amber-500 text-xs font-bold">•</span>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'text-amber-400 bg-slate-900/90 border-slate-800'
                    : 'text-amber-700 bg-amber-50/80 border-amber-200/80'
                }`}>
                  {turnoActual.comensales} pax
                </span>
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Executive Theme Switcher */}
            <button 
              type="button"
              onClick={toggleTheme}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 text-xs font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-amber-400 hover:text-amber-300 shadow-black/20'
                  : 'bg-white hover:bg-stone-50 border-amber-900/15 text-amber-800 hover:text-amber-900 shadow-amber-900/5'
              }`}
              title={isDark ? 'Cambiar a modo Warm Ivory' : 'Cambiar a modo Dark Luxury'}
              aria-label="Alternar tema ejecutivo"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 transition-transform duration-300" />
                  <span className="hidden lg:inline text-[0.7rem] uppercase tracking-wider font-semibold">
                    Warm Ivory
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-700 transition-transform duration-300" />
                  <span className="hidden lg:inline text-[0.7rem] uppercase tracking-wider font-semibold">
                    Dark Luxury
                  </span>
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => {
                analizarEscandallo();
                setDrawerOpen(true);
              }}
              disabled={analizandoIA}
              className="min-h-[48px] px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl border border-amber-300/40 shadow-md shadow-amber-500/10 transition-all flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              title="Analizar preparaciones y prever compras con IA"
            >
              {analizandoIA ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin stroke-[2.5]" />
              ) : (
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
              <span className="hidden md:inline">
                {analizandoIA ? 'Analizando...' : 'Analizar Escandallo IA'}
              </span>
              <span className="md:hidden">IA</span>
            </button>

            <button 
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="min-h-[48px] px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 text-white font-bold rounded-xl border border-red-400/30 shadow-md shadow-red-600/10 transition-all flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500 relative cursor-pointer"
              title="Panel de Compras y Alertas"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span className="hidden md:inline">Compras & Alertas</span>
              <span className="md:hidden">Compras</span>
              {comprasPendientes.length > 0 && (
                <span className="bg-white text-rose-950 font-black px-1.5 py-0.5 rounded-full text-[0.65rem] border border-rose-200 ml-0.5 shadow-sm">
                  {comprasPendientes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 flex flex-col">
        <Tabs.Root defaultValue="Saucier" className="flex flex-col w-full h-full flex-1">
          {/* Station Selection Tabs - Large Touch Targets (min-h-[48px]) */}
          <div className="overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            <Tabs.List 
              className={`flex gap-2 border-b w-max sm:w-full transition-colors ${
                isDark ? 'border-slate-800' : 'border-amber-900/15'
              }`}
              aria-label="Partidas de cocina de la brigada"
            >
              {stations.map(station => {
                const config = getStationConfig(station);
                const StationIcon = config.icon;
                const count = kanbanTareas.filter(t => t.partida === station).length;
                return (
                  <Tabs.Trigger
                    key={station}
                    value={station}
                    className={`min-h-[48px] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-t-xl border-t border-x -mb-[1px] transition-all outline-none whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      isDark
                        ? 'text-slate-400 bg-slate-900/50 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60 data-[state=active]:bg-slate-900 data-[state=active]:border-b-transparent shadow-sm'
                        : 'text-stone-600 bg-stone-200/50 border-stone-300/60 hover:text-stone-900 hover:bg-stone-200/80 data-[state=active]:bg-white data-[state=active]:border-b-transparent shadow-sm'
                    } ${config.tab.active} focus-visible:ring-2 focus-visible:ring-amber-400`}
                  >
                    <StationIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
                    <span className="font-serif tracking-wide">{station}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full transition-colors ${config.tab.badge}`}>
                      {count}
                    </span>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>
          </div>
          
          {/* Station Kanban Content */}
          <div className="mt-4 sm:mt-6 flex-1 flex flex-col">
            {stations.map(station => (
              <Tabs.Content
                key={station}
                value={station}
                className="focus:outline-none flex-1 flex flex-col"
              >
                <div className="flex-1 min-h-[65vh]">
                  <KanbanBoard partida={station} />
                </div>
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>
      </main>

      {/* Logistics & Shopping Side Drawer */}
      <LogisticsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
