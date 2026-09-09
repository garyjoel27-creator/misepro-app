import { useEffect, useState } from 'react';
import { useBrigadeStore } from './store/useBrigadeStore';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { LogisticsDrawer } from './components/LogisticsDrawer';

export default function App() {
  const { turnoActual, cargarDatos, analizarEscandallo, analizandoIA } = useBrigadeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stations = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900 shadow-sm border-b-2 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold text-amber-500 leading-tight">MisePro</h1>
            <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400">
              Control de Mise en Place Inteligente
            </span>
            <span className="text-sm font-medium text-slate-300">
              {turnoActual.nombreServicio} • {turnoActual.comensales} pax
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                analizarEscandallo();
                setDrawerOpen(true);
              }}
              disabled={analizandoIA}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-slate-900"
            >
              {analizandoIA ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span className="hidden sm:inline">{analizandoIA ? 'Analizando...' : 'Analizar Escandallo con IA'}</span>
              <span className="sm:hidden">IA</span>
            </button>

            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-slate-900"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Emergencia / Añadir Compra</span>
              <span className="sm:hidden">Compra</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Tabs Navigation */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        <Tabs.Root defaultValue="Saucier" className="flex flex-col w-full h-full">
          <Tabs.List className="flex border-b border-slate-200 w-full overflow-x-auto" aria-label="Partidas de la brigada">
            {stations.map(station => (
              <Tabs.Trigger
                key={station}
                value={station}
                className="px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-900 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                {station}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          
          <div className="mt-6 flex-1">
            {stations.map(station => (
              <Tabs.Content
                key={station}
                value={station}
                className="focus:outline-none h-full"
              >
                <div className="h-full min-h-[60vh]">
                  <KanbanBoard partida={station} />
                </div>
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>
      </main>

      <LogisticsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
