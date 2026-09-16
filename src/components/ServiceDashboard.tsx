import { useState, useEffect } from 'react';
import { 
  Flame, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  AlertOctagon, 
  Share2, 
  Check, 
  BellRing,
  CheckCircle2,
  Sparkles
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
    silenciarAlarmaTemporizador,
    agotados86,
    marcarAgotado86,
    quitarAgotado86
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

  // New Agotado Form
  const [nombre86, setNombre86] = useState('');
  const [partida86, setPartida86] = useState(partidas[0] || 'Cocina');
  const [motivo86, setMotivo86] = useState('');
  const [copied86, setCopied86] = useState(false);

  // Quick Presets
  const presets = [
    { label: '🥩 Solomillo Horno', minutos: 12, partida: 'Carnes' },
    { label: '🥖 Pan Caliente', minutos: 8, partida: 'Garde Manger' },
    { label: '🐟 Pescado Plancha', minutos: 5, partida: 'Pescados' },
    { label: '🍲 Reducción Salsa', minutos: 15, partida: 'Saucier' },
    { label: '⏱️ Pase Rápido', minutos: 3, partida: 'Carnes' },
  ];

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNombre.trim()) return;
    crearTemporizador(customNombre.trim(), customPartida, customMinutos);
    setCustomNombre('');
    setShowCustomModal(false);
  };

  const handleAdd86 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre86.trim()) return;
    marcarAgotado86(nombre86.trim(), partida86, motivo86.trim() || undefined);
    setNombre86('');
    setMotivo86('');
  };

  const handleCopy86Report = () => {
    if (agotados86.length === 0) return;
    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let text = `🚨 *AVISO DE SALA - PLATOS AGOTADOS (FUERA DE CARTA)* [${dateStr}]\n`;
    text += `Los siguientes platos/ingredientes NO están disponibles:\n\n`;
    agotados86.forEach((item, idx) => {
      text += `${idx + 1}. *${item.nombre}* (${item.partida})${item.motivo ? ` - ${item.motivo}` : ''} [Agotado a las ${item.hora}]\n`;
    });
    text += `\nPor favor, informar al equipo de camareros inmediatamente.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied86(true);
      setTimeout(() => setCopied86(false), 2500);
    }
  };

  const filteredTimers = selectedStation === 'Todas'
    ? temporizadores
    : temporizadores.filter(t => t.partida === selectedStation);

  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      {/* Top Urgent Status Banner */}
      <div className={`w-full p-4 sm:p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border-red-500/30 shadow-black/40' 
          : 'bg-gradient-to-r from-red-50 via-white to-amber-50 border-red-200 shadow-stone-900/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
            <Flame className="w-7 h-7 stroke-[2.5] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-red-500 dark:text-red-400">
                Pase de Servicio en Vivo
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-slate-300 mt-0.5">
              Control simultáneo de fuegos, hornos y control inmediato de platos agotados.
            </p>
          </div>
        </div>

        {/* Quick Summary KPIs */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-start flex-wrap">
          <div className={`px-3.5 py-2 rounded-xl border flex flex-col items-center justify-center ${
            isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            <span className="text-[0.65rem] uppercase font-bold text-stone-500 dark:text-slate-400">Timers</span>
            <span className="text-xl font-black text-amber-500">
              {temporizadores.filter(t => t.estado === 'activo').length}
            </span>
          </div>

          <div className={`px-3.5 py-2 rounded-xl border flex flex-col items-center justify-center ${
            isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            <span className="text-[0.65rem] uppercase font-bold text-stone-500 dark:text-slate-400">Agotados</span>
            <span className="text-xl font-black text-red-500">
              {agotados86.length}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Quick Launch Bar */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-stone-400 dark:text-slate-500">
          Lanzamiento Rápido de Temporizadores (1-Tap)
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => crearTemporizador(preset.label, preset.partida, preset.minutos)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-100 hover:border-amber-500/50'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900 hover:border-amber-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{preset.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black text-[0.65rem]">
                {preset.minutos}m
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowCustomModal(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Personalizado</span>
          </button>
        </div>
      </div>

      {/* Main Service Grid: Left (Timers) & Right (86 Agotados) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MULTI-TIMERS (8 COLS) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 stroke-[2.5]" />
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900 dark:text-white">
                Temporizadores de Cocción ({filteredTimers.length})
              </h3>
            </div>

            {/* Station Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['Todas', ...partidas].map((station) => (
                <button
                  key={station}
                  onClick={() => setSelectedStation(station)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedStation === station
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : isDark
                        ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  {station}
                </button>
              ))}
            </div>
          </div>

          {/* Timers Grid */}
          {filteredTimers.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-stone-200'
            }`}>
              <Clock className="w-10 h-10 text-stone-400 opacity-40" />
              <p className="text-sm font-semibold text-stone-500 dark:text-slate-400">
                No hay temporizadores en esta partida. Pulsa un botón rápido arriba para iniciar uno.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </section>

        {/* RIGHT COLUMN: GESTIÓN DE AGOTADOS (4 COLS) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* PLATOS AGOTADOS (FUERA DE CARTA) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500 stroke-[2.5]" />
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-stone-900 dark:text-white">
                  Platos Agotados (Fuera de Carta)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {agotados86.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const { isChefMode, pinJefe, vaciarAgotados86 } = useBrigadeStore.getState();
                        if (!isChefMode) {
                          const p = prompt("Acción protegida. Introduce el PIN del Jefe:");
                          if (p !== (pinJefe || "1234")) {
                            alert("PIN incorrecto.");
                            return;
                          }
                        }
                        if (confirm("¿Limpiar toda la lista de platos agotados?")) {
                          vaciarAgotados86();
                        }
                      }}
                      className={`px-2 py-1.5 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 ${
                        isDark ? 'border-slate-700 bg-slate-900' : 'border-stone-200 bg-white'
                      }`}
                      title="Limpiar lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleCopy86Report}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        copied86
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : isDark
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      {copied86 ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copied86 ? 'Copiado' : 'Avisar Agotados'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Add Agotado Form Card */}
            <form onSubmit={handleAdd86} className={`p-4 rounded-2xl border flex flex-col gap-3 shadow-md ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-stone-200'
            }`}>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                Registrar Plato Agotado
              </span>
              <input
                type="text"
                required
                value={nombre86}
                onChange={(e) => setNombre86(e.target.value)}
                placeholder="Nombre (ej. Chuletón Gallego)..."
                className={`min-h-[44px] px-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isDark ? 'bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={partida86}
                  onChange={(e) => setPartida86(e.target.value)}
                  className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-950/60 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                >
                  {partidas.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={motivo86}
                  onChange={(e) => setMotivo86(e.target.value)}
                  placeholder="Motivo (opcional)..."
                  className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    isDark ? 'bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={!nombre86.trim()}
                className="min-h-[44px] bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Marcar como Agotado</span>
              </button>
            </form>
          </div>

          {/* List of 86 Items */}
          <div className="flex flex-col gap-2.5">
            {agotados86.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 ${
                isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-stone-200'
              }`}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
                <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                  Todo disponible. Carta al 100%.
                </span>
              </div>
            ) : (
              agotados86.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isDark
                      ? 'bg-red-950/20 border-red-500/30 text-slate-200'
                      : 'bg-red-50/80 border-red-200 text-stone-900'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm tracking-tight text-red-600 dark:text-red-400 truncate line-through">
                        {item.nombre}
                      </span>
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded font-bold uppercase bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                        {item.partida}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[0.7rem] opacity-70">
                      <span>Agotado a las {item.hora}</span>
                      {item.motivo && <span>• {item.motivo}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => quitarAgotado86(item.id)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer shrink-0"
                    title="Restaurar plato a carta"
                  >
                    Restaurar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Custom Timer Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl flex flex-col gap-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <h3 className="text-xl font-bold font-serif tracking-tight">Nuevo Temporizador</h3>
            <form onSubmit={handleCreateCustom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Nombre de la Elaboración
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  placeholder="Ej. Arroz Socarrat, Foie Poché..."
                  className={`min-h-[48px] px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-950/50 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Minutos
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="300"
                    value={customMinutos}
                    onChange={(e) => setCustomMinutos(Number(e.target.value))}
                    className={`min-h-[48px] px-4 rounded-xl border text-sm font-black transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950/50 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Partida
                  </label>
                  <select
                    value={customPartida}
                    onChange={(e) => setCustomPartida(e.target.value)}
                    className={`min-h-[48px] px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-950/50 border-slate-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
                  >
                    {partidas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 min-h-[48px] rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Comenzar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Timer Card
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
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
    <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 select-none ${
      isFinished
        ? 'bg-red-500/15 border-red-500 shadow-xl shadow-red-500/20 animate-pulse ring-2 ring-red-500'
        : isDark
          ? 'bg-slate-900/90 border-slate-800 shadow-lg shadow-black/30 hover:border-slate-700'
          : 'bg-white border-stone-200 shadow-md shadow-amber-900/5 hover:border-amber-300'
    }`}>
      {/* Top Details */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`inline-flex items-center gap-1 text-[0.65rem] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${stationConfig.card.tag}`}>
            {timer.partida}
          </span>
          <h4 className="font-bold text-stone-900 dark:text-white text-base sm:text-lg leading-tight mt-1 truncate">
            {timer.nombre}
          </h4>
        </div>

        {isFinished ? (
          <span className="px-2 py-1 rounded-md bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 animate-bounce">
            <BellRing className="w-3.5 h-3.5" />
            ¡LISTO!
          </span>
        ) : timer.estado === 'pausado' ? (
          <span className="px-2 py-1 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
            Pausado
          </span>
        ) : null}
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-baseline justify-center py-2">
        <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
          isFinished 
            ? 'text-red-500' 
            : timer.estado === 'pausado'
              ? 'text-stone-400 dark:text-slate-500'
              : 'text-stone-900 dark:text-white'
        }`}>
          {timeFormatted}
        </span>
      </div>

      {/* Quick Adjust Buttons (+1 min, +5 min) */}
      {!isFinished ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAjustar(timer.id, 60)}
            className={`min-h-[38px] rounded-lg border font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-700 text-slate-300' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            +1 Min
          </button>
          <button
            onClick={() => onAjustar(timer.id, 300)}
            className={`min-h-[38px] rounded-lg border font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-950/60 hover:bg-slate-800 border-slate-700 text-slate-300' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            +5 Min
          </button>
        </div>
      ) : (
        !timer.alarmaSilenciada && (
          <button
            onClick={() => onSilenciar(timer.id)}
            className="w-full min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm uppercase tracking-widest cursor-pointer shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 animate-bounce"
          >
            <BellRing className="w-5 h-5" />
            Detener Alarma
          </button>
        )
      )}

      {/* Bottom Controls Bar (Play/Pause, Reset, Delete) */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {timer.estado === 'activo' ? (
            <button
              onClick={() => onPausar(timer.id)}
              className="min-h-[40px] px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pausar</span>
            </button>
          ) : (
            <button
              onClick={() => onReanudar(timer.id)}
              className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reanudar</span>
            </button>
          )}

          <button
            onClick={() => onReiniciar(timer.id)}
            className={`min-h-[40px] p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 border-slate-700 text-slate-400' : 'hover:bg-stone-100 border-stone-200 text-stone-500'
            }`}
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onEliminar(timer.id)}
          className="min-h-[40px] p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
          title="Eliminar temporizador"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
