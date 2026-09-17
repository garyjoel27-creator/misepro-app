import { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  BellRing,
  AlertTriangle
} from 'lucide-react';
import { useBrigadeStore, type Temporizador } from '../store/useBrigadeStore';
import { getStationConfig } from '../types/stations';
import { useTheme } from '../hooks/useTheme';

export function ServiceDashboard() {
  const { isDark } = useTheme();
  const { 
    partidas, 
    temporizadores, 
    crearTemporizador, 
    ajustarTiempoTemporizador, 
    pausarTemporizador, 
    reanudarTemporizador, 
    reiniciarTemporizador, 
    eliminarTemporizador,
    silenciarAlarmaTemporizador
  } = useBrigadeStore();

  // Tick for timers (every 1 second)
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // New Timer Form Modal/State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customNombre, setCustomNombre] = useState('');
  const [customMinutos, setCustomMinutos] = useState(10);
  const [customPartida, setCustomPartida] = useState(partidas[0] || 'Carnes');

  // Filter timers by station
  const [selectedStation, setSelectedStation] = useState<string>('Todas');

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNombre.trim()) return;
    crearTemporizador(customNombre.trim(), customPartida, customMinutos);
    setCustomNombre('');
    setShowCustomModal(false);
  };

  const filteredTimers = selectedStation === 'Todas'
    ? temporizadores
    : temporizadores.filter(t => t.partida === selectedStation);

  const now = Date.now();
  const activos = temporizadores.filter(t => t.estado === 'activo').length;
  const expirados = temporizadores.filter(t => t.estado !== 'pausado' && t.finTimestamp <= now && !t.alarmaSilenciada).length;

  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      {/* Top Urgent Status Banner - Solid High Contrast */}
      <div className={`w-full p-4 sm:p-5 rounded-2xl border shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-[#0f172a] border-slate-800 shadow-black/40' 
          : 'bg-white border-stone-300 shadow-stone-900/5'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 font-black">
            <Flame className="w-7 h-7 stroke-[2.5] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
                Pase de Servicio en Vivo • Centro de Fuegos
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-slate-300 mt-0.5">
              Control simultáneo de fuegos, hornos y tiempos de cocción a pantalla completa.
            </p>
          </div>
        </div>

        {/* Quick Summary KPIs */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[80px] ${
            isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-[#f8fafc] border-stone-300 shadow-xs'
          }`}>
            <span className="text-[0.65rem] uppercase font-black tracking-wider text-stone-500 dark:text-slate-400">Activos</span>
            <span className="text-xl font-black text-amber-500">
              {activos}
            </span>
          </div>

          {expirados > 0 && (
            <div className="px-4 py-2 rounded-xl border border-red-500 bg-red-500/10 dark:bg-red-950/40 flex flex-col items-center justify-center min-w-[80px] animate-pulse">
              <span className="text-[0.65rem] uppercase font-black tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> ¡Alarma!
              </span>
              <span className="text-xl font-black text-red-600 dark:text-red-400">
                {expirados}
              </span>
            </div>
          )}

          <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[80px] ${
            isDark ? 'bg-[#1e293b] border-slate-700' : 'bg-[#f8fafc] border-stone-300 shadow-xs'
          }`}>
            <span className="text-[0.65rem] uppercase font-black tracking-wider text-stone-500 dark:text-slate-400">Total</span>
            <span className="text-xl font-black text-stone-900 dark:text-white">
              {temporizadores.length}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar & Station Filter Pills - Solid High Contrast */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-stone-300 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500 stroke-[2.5]" />
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900 dark:text-white">
              Temporizadores ({filteredTimers.length})
            </h3>
          </div>

          {/* Botón Único y Prominente + Nuevo Timer */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            title="Crear un nuevo temporizador"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Nuevo Timer</span>
          </button>
        </div>

        {/* Station Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['Todas', ...partidas].map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedStation === station
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black ring-2 ring-amber-500/40'
                  : isDark
                    ? 'bg-[#1e293b] text-slate-300 hover:text-white border border-slate-700 font-bold'
                    : 'bg-[#f1f5f9] text-stone-700 hover:text-stone-950 border border-stone-300 font-bold'
              }`}
            >
              {station}
            </button>
          ))}
        </div>
      </div>

      {/* FULLSCREEN TIMERS GRID: 100% Width (grid-cols-1 md:grid-cols-2 xl:grid-cols-3) */}
      {filteredTimers.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center gap-4 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-stone-300'
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-8 h-8 stroke-[2]" />
          </div>
          <div>
            <h4 className="font-serif text-xl font-bold text-stone-900 dark:text-white">
              No hay temporizadores en esta partida
            </h4>
            <p className="text-sm font-medium text-stone-500 dark:text-slate-400 mt-1 max-w-md">
              Mantén el control absoluto de cocciones en horno, plancha o fuegos en directo.
            </p>
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="min-h-[48px] px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Crear Primer Temporizador</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTimers.map((timer) => (
            <TimerCard 
              key={timer.id} 
              timer={timer} 
              isDark={isDark}
              onAjustar={ajustarTiempoTemporizador}
              onPausar={pausarTemporizador}
              onReanudar={reanudarTemporizador}
              onReiniciar={reiniciarTemporizador}
              onEliminar={eliminarTemporizador}
              onSilenciar={silenciarAlarmaTemporizador}
            />
          ))}
        </div>
      )}

      {/* Custom Timer Modal - Solid High Contrast */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl flex flex-col gap-5 ${
            isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-stone-300 text-stone-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-serif font-black tracking-tight">Nuevo Temporizador de Pase</h3>
            </div>

            <form onSubmit={handleCreateCustom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-slate-300">
                  Nombre de la Elaboración / Fuego
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  placeholder="Ej. Arroz Socarrat, Foie Poché, Solomillo..."
                  className={`min-h-[50px] px-4 rounded-xl border text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500' : 'bg-[#f8fafc] border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-slate-300">
                    Minutos
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="300"
                    value={customMinutos}
                    onChange={(e) => setCustomMinutos(Number(e.target.value))}
                    className={`min-h-[50px] px-4 rounded-xl border text-base font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-[#f8fafc] border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-slate-300">
                    Partida
                  </label>
                  <select
                    value={customPartida}
                    onChange={(e) => setCustomPartida(e.target.value)}
                    className={`min-h-[50px] px-4 rounded-xl border text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-[#1e293b] border-slate-700 text-white' : 'bg-[#f8fafc] border-stone-300 text-stone-900'
                    }`}
                  >
                    {partidas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 min-h-[50px] rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-xs uppercase cursor-pointer hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[50px] bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Comenzar Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Timer Card (High-Contrast KDS Chef Board)
interface TimerCardProps {
  timer: Temporizador;
  isDark: boolean;
  onAjustar: (id: string, deltaSegundos: number) => void;
  onPausar: (id: string) => void;
  onReanudar: (id: string) => void;
  onReiniciar: (id: string) => void;
  onEliminar: (id: string) => void;
  onSilenciar: (id: string) => void;
}

function TimerCard({
  timer,
  isDark,
  onAjustar,
  onPausar,
  onReanudar,
  onReiniciar,
  onEliminar,
  onSilenciar
}: TimerCardProps) {
  const stationConfig = getStationConfig(timer.partida);

  // Compute remaining seconds based on absolute finTimestamp
  let remaining = 0;
  if (timer.estado === 'pausado') {
    remaining = timer.segundosRestantesPausado ?? 0;
  } else {
    remaining = Math.max(0, Math.floor((timer.finTimestamp - Date.now()) / 1000));
  }

  const isFinished = remaining === 0 && timer.estado !== 'pausado';
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let intervalId: ReturnType<typeof setInterval>;
    let soundInterval: ReturnType<typeof setInterval>;

    if (isFinished && !timer.alarmaSilenciada) {
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
  }, [isFinished, timer.alarmaSilenciada]);

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between gap-5 select-none shadow-xl ${
      isFinished
        ? 'bg-red-500/15 border-red-500 shadow-red-500/20 animate-pulse ring-4 ring-red-500/40'
        : isDark
          ? 'bg-[#0f172a] border-slate-800 shadow-black/40 hover:border-slate-700'
          : 'bg-white border-stone-300 shadow-stone-900/5 hover:border-amber-400'
    }`}>
      {/* Top Header & Tags */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 text-[0.7rem] uppercase font-black tracking-wider px-2.5 py-1 rounded-lg ${stationConfig.card.tag}`}>
            {timer.partida}
          </span>
          <h4 className="font-black text-stone-900 dark:text-white text-lg sm:text-xl leading-tight mt-2 whitespace-normal break-words">
            {timer.nombre}
          </h4>
        </div>

        {isFinished ? (
          <span className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 animate-bounce shadow-md shadow-red-600/30 shrink-0">
            <BellRing className="w-4 h-4" />
            ¡LISTO!
          </span>
        ) : timer.estado === 'pausado' ? (
          <span className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider shrink-0">
            Pausado
          </span>
        ) : null}
      </div>

      {/* Main Countdown Display: Giant Digits text-5xl sm:text-6xl md:text-7xl */}
      <div className="flex items-baseline justify-center py-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-2xl border border-stone-200 dark:border-slate-700/80">
        <span className={`text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tight ${
          isFinished 
            ? 'text-red-600 dark:text-red-400 animate-pulse' 
            : timer.estado === 'pausado'
              ? 'text-stone-400 dark:text-slate-500'
              : 'text-stone-950 dark:text-amber-400'
        }`}>
          {timeFormatted}
        </span>
      </div>

      {/* Quick Adjust Buttons (+1 min, +5 min) or Stop Alarm button */}
      {!isFinished ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAjustar(timer.id, 60)}
            className={`min-h-[44px] rounded-xl border font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-xs ${
              isDark 
                ? 'bg-[#1e293b] hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-[#f1f5f9] hover:bg-stone-200 border-stone-300 text-stone-800'
            }`}
          >
            +1 Min
          </button>
          <button
            onClick={() => onAjustar(timer.id, 300)}
            className={`min-h-[44px] rounded-xl border font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-xs ${
              isDark 
                ? 'bg-[#1e293b] hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-[#f1f5f9] hover:bg-stone-200 border-stone-300 text-stone-800'
            }`}
          >
            +5 Min
          </button>
        </div>
      ) : (
        !timer.alarmaSilenciada && (
          <button
            onClick={() => onSilenciar(timer.id)}
            className="w-full min-h-[52px] rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm sm:text-base uppercase tracking-widest cursor-pointer shadow-xl shadow-red-600/40 transition-all flex items-center justify-center gap-2 animate-bounce ring-2 ring-red-400"
          >
            <BellRing className="w-6 h-6" />
            Detener Alarma
          </button>
        )
      )}

      {/* Bottom Controls Bar (Play/Pause, Reset, Delete) - Tactile Sizing */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {timer.estado === 'activo' ? (
            <button
              onClick={() => onPausar(timer.id)}
              className="min-h-[44px] px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-amber-500/30"
            >
              <Pause className="w-4 h-4 stroke-[3]" />
              <span>Pausar</span>
            </button>
          ) : (
            <button
              onClick={() => onReanudar(timer.id)}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reanudar</span>
            </button>
          )}

          <button
            onClick={() => onReiniciar(timer.id)}
            className={`min-h-[44px] w-[44px] rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
              isDark ? 'bg-[#1e293b] hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-[#f1f5f9] hover:bg-stone-200 border-stone-300 text-stone-700'
            }`}
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <button
          onClick={() => onEliminar(timer.id)}
          className="min-h-[44px] w-[44px] rounded-xl text-red-500 hover:bg-red-500/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center border border-transparent hover:border-red-500/30"
          title="Eliminar temporizador"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
