import { useEffect, useState } from 'react';
import { useBrigadeStore, type NotaPostIt } from './store/useBrigadeStore';
import * as Tabs from '@radix-ui/react-tabs';
import { 
  Sparkles, 
  Loader2, 
  Sun, 
  Moon, 
  Flame, 
  ClipboardList, 
  Lock, 
  Unlock, 
  Eye, 
  Send, 
  StickyNote, 
  X, 
  Package, 
  Settings, 
  Pencil, 
  Trash2, 
  BellOff, 
  RotateCcw,
  Mic,
  ChefHat,
  Plus,
  ShieldCheck 
} from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { LogisticsDrawer } from './components/LogisticsDrawer';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ShiftSettingsModal } from './components/ShiftSettingsModal';
import { ServiceCountdown } from './components/ServiceCountdown';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ServiceDashboard } from './components/ServiceDashboard';
import { APPCCDashboard } from './components/APPCCDashboard';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { StationManagerModal } from './components/StationManagerModal';
import { useTheme } from './hooks/useTheme';
import { getStationConfig } from './types/stations';

/**
 * Modo Zen Puro (Solo Alarmas y Temporizadores)
 * Eliminado completamente el panel 86 para foco 100% en los fuegos del pase.
 */
function ZenModeView() {
  const { temporizadores, toggleModoZen, silenciarAlarmaTemporizador, reiniciarTemporizador, eliminarTemporizador } = useBrigadeStore();
  const activos = temporizadores.filter(t => t.estado !== 'pausado');
  
  const hasFinishedTimers = activos.some(t => Math.max(0, Math.floor((t.finTimestamp - Date.now()) / 1000)) === 0 && !t.alarmaSilenciada);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let intervalId: ReturnType<typeof setInterval>;
    let soundInterval: ReturnType<typeof setInterval>;

    if (hasFinishedTimers) {
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300]);
        intervalId = setInterval(() => {
           navigator.vibrate([300, 100, 300, 100, 300]);
        }, 2000);
      }
      
      const playBeep = () => {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          } else {
            return;
          }
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      };

      playBeep();
      soundInterval = setInterval(playBeep, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (soundInterval) clearInterval(soundInterval);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [hasFinishedTimers]);

  return (
    <div className="fixed inset-0 z-50 bg-[#05070d] text-white flex flex-col p-4 sm:p-8 overflow-hidden select-none">
      {/* Top Bar with Title & Close Button */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif tracking-widest font-bold text-amber-400">
              MODO ZEN • ALARMAS
            </h1>
            <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
              Foco exclusivo en tiempos de cocción
            </p>
          </div>
        </div>

        <button 
          onClick={toggleModoZen} 
          className="w-12 h-12 rounded-2xl bg-stone-900/90 border border-stone-800 hover:bg-stone-800 flex items-center justify-center text-stone-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
          title="Salir del Modo Zen"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Pure Timers Grid */}
      <div className="flex-1 overflow-y-auto py-6 flex flex-col justify-center">
        {activos.length === 0 ? (
          <div className="text-center py-20 opacity-60 flex flex-col items-center justify-center gap-4">
            <Flame className="w-16 h-16 text-stone-600 stroke-[1.5]" />
            <p className="font-serif text-2xl tracking-wider text-stone-400">
              No hay temporizadores activos en el pase
            </p>
            <p className="text-xs uppercase tracking-widest text-stone-600 font-bold">
              Crea uno en el Modo Servicio para monitorearlo aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
            {activos.map(t => {
              const rem = Math.max(0, Math.floor((t.finTimestamp - Date.now()) / 1000));
              const m = Math.floor(rem / 60);
              const s = rem % 60;
              const isFin = rem === 0;

              return (
                <div 
                  key={t.id} 
                  className={`p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col justify-between shadow-2xl ${
                    isFin 
                      ? 'border-red-500 bg-red-950/60 text-red-400 shadow-red-500/20 animate-pulse ring-4 ring-red-500/30' 
                      : 'border-stone-800/80 bg-stone-900/60 backdrop-blur-xl'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-2xl sm:text-3xl font-black uppercase tracking-tight truncate leading-tight text-white">
                      {t.nombre}
                    </span>
                    <span className="text-xs sm:text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                      {t.partida}
                    </span>
                  </div>

                  <div className="my-2 text-center">
                    <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter ${
                      isFin ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                    {isFin && !t.alarmaSilenciada && (
                      <button
                        onClick={() => silenciarAlarmaTemporizador(t.id)}
                        className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-md"
                      >
                        <BellOff className="w-4 h-4" />
                        Silenciar
                      </button>
                    )}
                    <button
                      onClick={() => reiniciarTemporizador(t.id)}
                      className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Reiniciar temporizador"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reiniciar
                    </button>
                    <button
                      onClick={() => eliminarTemporizador(t.id)}
                      className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Eliminar temporizador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { 
    kanbanTareas, 
    comprasPendientes, 
    cargarDatos, 
    analizarEscandallo, 
    analizandoIA, 
    partidas,
    coloresPartidas,
    nombreRestaurante,
    temporizadores,
    agotados86,
    isChefMode,
    toggleChefMode,
    pinJefe,
    modoZen,
    toggleModoZen,
    cerrarTurno,
    notasPostIt,
    agregarNotaPostIt,
    editarNotaPostIt,
    eliminarNotaPostIt
  } = useBrigadeStore();
  
  // Navigation: Bottom App Bar Tabs
  const [activeTab, setActiveTab] = useState<'prep' | 'pase' | 'appcc' | 'logistica' | 'ajustes'>('prep');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Post-It Modals
  const [showPostItModal, setShowPostItModal] = useState(false);
  const [postItText, setPostItText] = useState('');
  const [editingNote, setEditingNote] = useState<NotaPostIt | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  
  // Voice Assistant Modal
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Station Manager Modal
  const [showStationManager, setShowStationManager] = useState(false);
  
  const { isDark, toggleTheme } = useTheme();

  // Tick for real-time header KPIs (timers expiration)
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const tareasCriticas = kanbanTareas.filter(t => t.prioridad === 'Critica' && t.estado !== 'Completado').length;
  
  const now = Date.now();
  const numTimersTotal = temporizadores.filter(t => t.estado !== 'pausado').length;
  const numTimersExpirados = temporizadores.filter(t => t.estado !== 'pausado' && t.finTimestamp <= now).length;
  const num86 = agotados86.length;

  if (modoZen) {
    return <ZenModeView />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 pb-[env(safe-area-inset-bottom)] ${
      isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#fcfaf6] text-stone-900'
    }`}>
      {/* Apple Glass Sticky Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl transition-all duration-300 pt-[env(safe-area-inset-top)] ${
        isDark
          ? 'bg-slate-950/75 border-b border-slate-800/60 shadow-lg shadow-black/20'
          : 'bg-white/75 border-b border-stone-200/60 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand & Shift Info */}
          <div className="flex items-center gap-3">
            <SidebarDrawer />
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${
              isDark
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-stone-900 text-amber-400 border border-stone-800'
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 21l3-3M22 3c-4.5 0-9.5 2-12 7l-5 5c-1 1-1 3 0 4s3 1 4 0l5-5c5-2.5 7-7.5 7-12z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif tracking-widest font-bold text-amber-500 leading-none">
                  MISE·PRO
                </h1>
              </div>
              <button
                onClick={() => setShowStationManager(true)}
                className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-slate-400 font-bold truncate max-w-[140px] sm:max-w-[220px] text-left hover:text-amber-500 transition-colors cursor-pointer"
                title="Personalizar establecimiento y partidas"
              >
                {nombreRestaurante || 'Mi Cocina Pro'}
              </button>
            </div>
          </div>
          
          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Live KPI status badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md bg-stone-100/60 dark:bg-slate-900/60 border-stone-200/80 dark:border-slate-800/80">
              {tareasCriticas > 0 && (
                <span className="flex items-center gap-1 text-xs font-black text-red-500 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {tareasCriticas} crít.
                </span>
              )}
              {num86 > 0 && (
                <span className="text-xs font-bold text-amber-500">
                  {num86} agotados
                </span>
              )}
              {numTimersTotal > 0 && (
                <span className={`text-xs font-bold ${numTimersExpirados > 0 ? 'text-red-500 font-black animate-pulse' : 'text-emerald-500'}`}>
                  ⏱️ {numTimersTotal}
                </span>
              )}
              {tareasCriticas === 0 && num86 === 0 && numTimersTotal === 0 && (
                <span className="text-xs font-semibold text-stone-400 dark:text-slate-500">
                  Operativa en orden
                </span>
              )}
            </div>

            <ServiceCountdown />

            {/* Quick Voice Commander Button */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="min-h-[40px] px-3 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ring-1 ring-amber-500/30"
              title="Asistente de Voz Manos Libres"
            >
              <Mic className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Voz</span>
            </button>

            {/* Quick Post-It Button */}
            <button
              onClick={() => setShowPostItModal(true)}
              className="min-h-[40px] px-3 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Anotar nota rápida (Post-It)"
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden md:inline">Nota</span>
            </button>

            {/* Quick Zen Mode Button */}
            <button
              onClick={toggleModoZen}
              className="min-h-[40px] px-3 rounded-xl border border-stone-300/80 dark:border-slate-700/80 bg-stone-100/70 dark:bg-slate-900/70 hover:bg-amber-500 hover:text-stone-950 text-stone-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Modo Zen (Solo alarmas en pantalla completa)"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">Zen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (with bottom padding to prevent overlap with Bottom App Bar) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 pb-28 flex flex-col">
        {/* Post-Its rendering (with Edit & Delete) */}
        {notasPostIt.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {notasPostIt.map(nota => (
              <div 
                key={nota.id} 
                className="relative group bg-amber-100 dark:bg-amber-300 text-amber-950 p-4 rounded-2xl shadow-md border border-amber-300/80 max-w-xs transition-transform hover:-translate-y-0.5"
              >
                {/* Note action buttons (Always accessible for touchscreens) */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingNote(nota);
                      setEditNoteText(nota.texto);
                    }}
                    className="w-7 h-7 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    title="Editar nota"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => eliminarNotaPostIt(nota.id)} 
                    className="w-7 h-7 rounded-lg bg-amber-200/80 hover:bg-red-500 hover:text-white text-amber-900 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 mb-2" />
                <p className="font-serif text-sm font-medium whitespace-pre-wrap leading-relaxed pr-14">
                  {nota.texto}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: MISE EN PLACE (PREP) */}
        {activeTab === 'prep' && (
          <Tabs.Root defaultValue="Panel Maestro" className="flex flex-col w-full h-full flex-1">
            {/* Station Selection Tabs - Apple Segmented Control Style */}
            <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
              <Tabs.List 
                className={`p-1.5 rounded-2xl border flex gap-1.5 w-max sm:w-full backdrop-blur-xl transition-colors ${
                  isDark ? 'bg-slate-900/70 border-slate-800/80' : 'bg-stone-200/60 border-stone-300/60'
                }`}
                aria-label="Partidas de cocina"
              >
                <Tabs.Trigger
                  value="Panel Maestro"
                  className={`min-h-[44px] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all outline-none whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm'
                  }`}
                >
                  <Eye className="w-4 h-4 stroke-[2.2]" />
                  <span className="font-serif">Panel Maestro</span>
                </Tabs.Trigger>

                {partidas.map(station => {
                  const config = getStationConfig(station, coloresPartidas[station]);
                  const StationIcon = config.icon;
                  const count = kanbanTareas.filter(t => t.partida === station && t.estado !== 'Completado').length;
                  return (
                    <Tabs.Trigger
                      key={station}
                      value={station}
                      className={`min-h-[44px] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all outline-none whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        isDark
                          ? 'text-slate-400 hover:text-slate-200 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm'
                          : 'text-stone-600 hover:text-stone-900 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm'
                      }`}
                    >
                      <StationIcon className="w-4 h-4 stroke-[2.2]" />
                      <span className="font-serif">{station}</span>
                      {count > 0 && (
                        <span className={`text-[0.7rem] font-black px-2 py-0.5 rounded-full ${config.tab.badge}`}>
                          {count}
                        </span>
                      )}
                    </Tabs.Trigger>
                  );
                })}

                {/* Botón directo para gestionar o añadir partidas */}
                <button
                  type="button"
                  onClick={() => setShowStationManager(true)}
                  className={`min-h-[44px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border border-dashed ${
                    isDark 
                      ? 'border-slate-700 hover:border-amber-500/60 text-slate-400 hover:text-amber-400' 
                      : 'border-stone-300 hover:border-amber-500 text-stone-600 hover:text-amber-600'
                  }`}
                  title="Gestionar o añadir partidas"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Partidas</span>
                </button>
              </Tabs.List>
            </div>
            
            {/* Station Task List */}
            <div className="mt-4 flex-1 flex flex-col">
              <Tabs.Content
                value="Panel Maestro"
                className="focus:outline-none flex-1 flex flex-col"
              >
                {partidas.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 my-8 max-w-md mx-auto flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <ChefHat className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                      Tu cocina no tiene partidas aún
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Crea tus partidas personalizadas (ej. Plancha, Frituras, Cuarto Frío) o carga la plantilla clásica.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowStationManager(true)}
                      className="mt-2 min-h-[48px] px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      + Configurar Mis Partidas
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[60vh] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
                    {partidas.map(station => (
                      <div key={station} className="flex flex-col h-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-stone-200/80 dark:border-slate-800/80 overflow-hidden shadow-lg shadow-amber-900/5 dark:shadow-xl dark:shadow-black/40">
                        <div className="p-4 border-b border-stone-200/80 dark:border-slate-800/80 bg-stone-50/70 dark:bg-slate-950/50 flex items-center justify-between">
                          <h3 className="font-bold text-stone-900 dark:text-slate-100 uppercase tracking-wider text-sm">
                            {station}
                          </h3>
                          <span className={`font-black text-xs py-0.5 px-2.5 rounded-full ${getStationConfig(station, coloresPartidas[station]).column.countBadge}`}>
                            {kanbanTareas.filter(t => t.partida === station && t.estado !== 'Completado').length} pend.
                          </span>
                        </div>
                        <div className="p-2 sm:p-3 overflow-y-auto max-h-[60vh] flex flex-col">
                          <KanbanBoard partida={station} masterMode />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tabs.Content>

              {partidas.map(station => (
                <Tabs.Content
                  key={station}
                  value={station}
                  className="focus:outline-none flex-1 flex flex-col"
                >
                  <div className="flex-1 min-h-[60vh]">
                    <KanbanBoard partida={station} />
                  </div>
                </Tabs.Content>
              ))}
            </div>
          </Tabs.Root>
        )}

        {/* Tab 2: PASE & TIMERS (SERVICE DASHBOARD) */}
        {activeTab === 'pase' && (
          <ServiceDashboard />
        )}

        {/* Tab 3: APPCC & SANIDAD (AUDITORÍA) */}
        {activeTab === 'appcc' && (
          <APPCCDashboard />
        )}

        {/* Tab 4: LOGÍSTICA & 86 (COMPRAS Y AGOTADOS) */}
        {activeTab === 'logistica' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
                  Logística y Stock Crítico
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-stone-500 dark:text-slate-400">
                  Control de ingredientes agotados y lista de pedidos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    analizarEscandallo();
                    setDrawerOpen(true);
                  }}
                  disabled={analizandoIA}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {analizandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{analizandoIA ? 'Analizando...' : 'Escandallo IA'}</span>
                </button>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-slate-800 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Ver Compras ({comprasPendientes.length})</span>
                </button>
              </div>
            </div>

            {/* Fuera de Carta / Agotados Section */}
            <div className="p-6 rounded-3xl border backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  Platos Agotados (Fuera de Carta)
                </h3>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 border border-red-500/20">
                  {num86} agotados
                </span>
              </div>

              {agotados86.length === 0 ? (
                <p className="text-sm font-medium text-stone-500 dark:text-slate-400 py-4 text-center">
                  No hay productos agotados en carta. ¡Todo disponible!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {agotados86.map(item => (
                    <div key={item.id} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-900 dark:text-slate-100 text-base">{item.nombre}</span>
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{item.partida} • {item.hora}</p>
                      </div>
                      <button
                        onClick={() => useBrigadeStore.getState().quitarAgotado86(item.id)}
                        className="self-start text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Restaurar plato a carta
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Preview Block */}
            <div className="p-6 rounded-3xl border backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Lista de Compras de la Brigada
                </h3>
                {comprasPendientes.length > 0 && (
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Abrir pedido completo
                  </button>
                )}
              </div>

              {comprasPendientes.length === 0 ? (
                <p className="text-sm font-medium text-stone-500 dark:text-slate-400 py-4 text-center">
                  No hay pedidos pendientes. Añade ingredientes desde las tarjetas de elaboración.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {comprasPendientes.slice(0, 6).map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="font-semibold text-sm text-stone-800 dark:text-slate-200">{c.ingrediente}</span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        x{c.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: AJUSTES & PANEL DE JEFE */}
        {activeTab === 'ajustes' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
                Centro de Mando & Ajustes
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold text-stone-500 dark:text-slate-400">
                Seguridad, cierre de turno y configuración de servicio
              </p>
            </div>

            {/* Chef Mode Lock Card */}
            <div className={`p-6 rounded-3xl border transition-all shadow-sm flex flex-col gap-4 ${
              isChefMode 
                ? 'bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200'
                : 'bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isChefMode ? 'bg-red-500 text-white' : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                  }`}>
                    {isChefMode ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">
                      {isChefMode ? 'Modo Jefe Activo' : 'Modo Cocinero (Protegido)'}
                    </h3>
                    <p className="text-xs opacity-75 font-medium">
                      {isChefMode ? 'Tienes acceso total para borrar y cerrar el turno' : 'Las acciones destructivas requieren el PIN de 4 dígitos'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isChefMode) {
                      toggleChefMode();
                    } else {
                      const p = prompt("Introduce el PIN del Jefe:");
                      if (p === (pinJefe || "1234")) {
                        toggleChefMode(p);
                      } else if (p) {
                        alert("PIN incorrecto.");
                      }
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                    isChefMode 
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                  }`}
                >
                  {isChefMode ? 'Bloquear' : 'Desbloquear'}
                </button>
              </div>
            </div>

            {/* Gestor de Partidas y Establecimiento */}
            <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                      Partidas & Establecimiento
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      {nombreRestaurante} • {partidas.length} {partidas.length === 1 ? 'partida activa' : 'partidas activas'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStationManager(true)}
                  className="min-h-[44px] px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-transform active:scale-95 shadow-md shadow-amber-500/10 self-start sm:self-auto"
                >
                  Personalizar Partidas
                </button>
              </div>
            </div>

            {/* Cerrar Turno (WhatsApp) Action */}
            <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" />
                Cierre de Turno y Relevo por WhatsApp
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium leading-relaxed">
                Genera un informe con las tareas pendientes por partida, los platos del día, los platos agotados (fuera de carta), las caducidades que hay que usar hoy y todas las notas de trinchera.
              </p>

              <button
                onClick={() => {
                  if (!isChefMode) {
                    const p = prompt("Solo el Jefe puede cerrar el turno. Introduce el PIN:");
                    if (p !== (pinJefe || "1234")) {
                      alert("PIN incorrecto.");
                      return;
                    }
                  }
                  if (confirm("¿Cerrar el turno y enviar el reporte del servicio por WhatsApp?")) {
                    cerrarTurno();
                  }
                }}
                className="mt-2 min-h-[48px] px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Generar Parte de Relevo (WhatsApp)</span>
              </button>
            </div>

            {/* Shift Configuration & Theme */}
            <div className="p-6 rounded-3xl border bg-white/70 dark:bg-slate-900/70 border-stone-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-500" />
                Configuración del Servicio
              </h3>

              <div className="flex items-center justify-between py-2 border-b border-stone-200/60 dark:border-slate-800/60">
                <div>
                  <span className="text-sm font-semibold">Ajustes de Pax y Horario</span>
                  <p className="text-xs text-stone-500 dark:text-slate-400">Modifica el nombre del pase y comensales</p>
                </div>
                <ShiftSettingsModal />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-semibold">Tema Visual de la Interfaz</span>
                  <p className="text-xs text-stone-500 dark:text-slate-400">{isDark ? 'Dark Luxury activo' : 'Warm Ivory activo'}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
                  <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Logistics & Shopping Side Drawer */}
      <LogisticsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Floating Action Button for Task Creation (Elevated above Bottom Bar) */}
      {activeTab === 'prep' && (
        <div className="fixed bottom-24 right-5 z-40">
          <CreateTaskModal partidaActual={partidas[0] || 'Saucier'} />
        </div>
      )}

      {/* FIXED BOTTOM APP BAR (Navegación Inferior Nativa Apple) */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl transition-all duration-300 border-t ${
          isDark
            ? 'bg-slate-950/85 border-slate-800/80 shadow-2xl shadow-black/80'
            : 'bg-white/85 border-stone-200/80 shadow-2xl shadow-stone-900/10'
        } pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-3 sm:px-8 flex items-center justify-around`}
        aria-label="Navegación principal de MisePro"
      >
        {/* Tab 1: Prep */}
        <button
          onClick={() => setActiveTab('prep')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 px-2 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'prep'
              ? 'text-amber-500 dark:text-amber-400 font-black'
              : 'text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300'
          }`}
        >
          <ClipboardList className={`w-5 h-5 ${activeTab === 'prep' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[0.68rem] tracking-tight">Prep</span>
        </button>

        {/* Tab 2: Pase */}
        <button
          onClick={() => setActiveTab('pase')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 px-2 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'pase'
              ? 'text-amber-500 dark:text-amber-400 font-black'
              : 'text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300'
          }`}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'pase' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[0.68rem] tracking-tight">Pase</span>
          {numTimersTotal > 0 && (
            <span className={`absolute top-0 right-3 w-2 h-2 rounded-full ${
              numTimersExpirados > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
            }`} />
          )}
        </button>

        {/* Tab 3: APPCC Sanidad */}
        <button
          onClick={() => setActiveTab('appcc')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 px-1.5 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'appcc'
              ? 'text-amber-500 dark:text-amber-400 font-black'
              : 'text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === 'appcc' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[0.68rem] tracking-tight">APPCC</span>
        </button>

        {/* Tab 4: Logística */}
        <button
          onClick={() => setActiveTab('logistica')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 px-2 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'logistica'
              ? 'text-amber-500 dark:text-amber-400 font-black'
              : 'text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className={`w-5 h-5 ${activeTab === 'logistica' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[0.68rem] tracking-tight">Logística</span>
          {(num86 > 0 || comprasPendientes.length > 0) && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Tab 4: Ajustes */}
        <button
          onClick={() => setActiveTab('ajustes')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 px-2 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === 'ajustes'
              ? 'text-amber-500 dark:text-amber-400 font-black'
              : 'text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'ajustes' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[0.68rem] tracking-tight">Ajustes</span>
          {isChefMode && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </nav>

      {/* Modal: Crear Nueva Nota Post-It */}
      {showPostItModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 bg-amber-100 border border-amber-300 text-amber-950">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-serif">📌 Nueva Nota</h3>
              <button onClick={() => setShowPostItModal(false)} className="p-1 hover:bg-amber-200 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={postItText}
              onChange={(e) => setPostItText(e.target.value)}
              placeholder="Falta sal, repasar nevera 3, pedir carne..."
              className="w-full bg-white/70 rounded-2xl p-3 text-sm font-medium border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder:text-amber-700/50"
            />
            <button
              onClick={() => {
                if (postItText.trim()) {
                  agregarNotaPostIt(postItText.trim());
                  setPostItText('');
                  setShowPostItModal(false);
                }
              }}
              className="min-h-[46px] bg-amber-500 hover:bg-amber-400 font-black text-amber-950 uppercase tracking-widest rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Guardar Nota
            </button>
          </div>
        </div>
      )}

      {/* Modal: EDITAR Nota Post-It */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 bg-amber-100 border border-amber-300 text-amber-950">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-serif">✏️ Editar Nota</h3>
              <button onClick={() => setEditingNote(null)} className="p-1 hover:bg-amber-200 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              className="w-full bg-white/70 rounded-2xl p-3 text-sm font-medium border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingNote(null)}
                className="flex-1 min-h-[46px] bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editNoteText.trim() && editingNote) {
                    editarNotaPostIt(editingNote.id, editNoteText.trim());
                    setEditingNote(null);
                  }
                }}
                className="flex-1 min-h-[46px] bg-amber-500 hover:bg-amber-400 font-black text-amber-950 uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) de Asistente de Voz */}
      <button
        onClick={() => setShowVoiceModal(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 shadow-[0_4px_25px_rgba(245,158,11,0.45)] border-2 border-amber-300 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
        title="Hablar al Asistente de Voz (Manos Libres)"
      >
        <Mic className="w-7 h-7 stroke-[2.2] group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
      </button>

      {/* Modal Interactivo de Asistente de Voz */}
      <VoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        currentStation={(partidas[0] as any) || 'Saucier'}
      />

      {/* Asistente Inicial de Bienvenida (Onboarding) */}
      <OnboardingWizardModal />

      {/* Gestor Visual de Partidas y Restaurante */}
      <StationManagerModal
        open={showStationManager}
        onOpenChange={setShowStationManager}
      />
    </div>
  );
}

