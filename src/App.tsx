import { useEffect, useState } from 'react';
import { useBrigadeStore } from './store/useBrigadeStore';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertCircle, Sparkles, Loader2, UtensilsCrossed } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { LogisticsDrawer } from './components/LogisticsDrawer';

export default function App() {
  const { turnoActual, kanbanTareas, comprasPendientes, cargarDatos, analizarEscandallo, analizandoIA } = useBrigadeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stations = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Sticky Top Header - Flat Industrial Contrast */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b-4 border-amber-500 shadow-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[72px] sm:h-20 flex items-center justify-between gap-2">
          {/* Brand & Shift Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-amber-400 leading-none tracking-tight">
                  MisePro
                </h1>
                <span className="hidden sm:inline-block text-[0.65rem] uppercase tracking-widest font-black text-slate-400">
                  Brigade Sync
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {turnoActual.nombreServicio}
                </span>
                <span className="text-amber-500 text-xs font-black">•</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {turnoActual.comensales} pax
                </span>
              </div>
            </div>
          </div>
          
          {/* Header Actions (min-h-[44px] touch targets) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={() => {
                analizarEscandallo();
                setDrawerOpen(true);
              }}
              disabled={analizandoIA}
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black rounded-xl border-2 border-slate-900 transition-colors flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black rounded-xl border-2 border-slate-900 transition-colors flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500 relative"
              title="Panel de Compras y Alertas"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span className="hidden md:inline">Compras & Alertas</span>
              <span className="md:hidden">Compras</span>
              {comprasPendientes.length > 0 && (
                <span className="bg-white text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[0.65rem] border border-slate-900 ml-0.5">
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
              className="flex gap-2 border-b-2 border-slate-900 w-max sm:w-full" 
              aria-label="Partidas de cocina de la brigada"
            >
              {stations.map(station => {
                const count = kanbanTareas.filter(t => t.partida === station).length;
                return (
                  <Tabs.Trigger
                    key={station}
                    value={station}
                    className="min-h-[48px] px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider rounded-t-xl border-2 border-b-0 -mb-[2px] transition-all outline-none whitespace-nowrap flex items-center gap-2 text-slate-700 bg-slate-200 border-slate-400 hover:text-slate-950 hover:bg-slate-300 hover:border-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <span>{station}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full border border-slate-900 bg-amber-400 text-slate-950">
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
