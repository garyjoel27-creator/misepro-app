import { useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Check, 
  RotateCcw, 
  Volume2, 
  Flame, 
  ShoppingBag, 
  Ban, 
  Timer as TimerIcon, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useVoiceCommander, type ParsedVoiceCommand } from '../hooks/useVoiceCommander';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { type StationName } from '../types/stations';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation?: StationName;
}

export function VoiceAssistantModal({ isOpen, onClose, currentStation = 'Saucier' }: VoiceAssistantModalProps) {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    parsedCommand,
    errorMessage,
    startListening,
    stopListening,
    resetCommand
  } = useVoiceCommander(currentStation);

  const {
    agregarTarea,
    agregarCompra,
    marcarAgotado86,
    crearTemporizador
  } = useBrigadeStore();

  // Iniciar escucha automáticamente al abrir
  useEffect(() => {
    if (isOpen && isSupported) {
      startListening();
    } else {
      stopListening();
      resetCommand();
    }
    return () => {
      stopListening();
    };
  }, [isOpen, isSupported, startListening, stopListening, resetCommand]);

  if (!isOpen) return null;

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}

    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 100]);
    }
  };

  const handleConfirmCommand = (cmd: ParsedVoiceCommand) => {
    playSuccessChime();

    switch (cmd.tipo) {
      case 'tarea': {
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: cmd.nombre,
          cantidad: cmd.cantidad || 1,
          unidad: cmd.unidad || 'Kg',
          prioridad: cmd.prioridad || 'Media',
          estado: 'Pendiente',
          partida: cmd.partida || currentStation
        });
        break;
      }
      case 'compra': {
        agregarCompra({
          id: crypto.randomUUID(),
          ingrediente: cmd.nombre,
          cantidad: cmd.cantidad || 1,
          categoria: cmd.categoria || 'Vegetales'
        });
        break;
      }
      case 'agotado': {
        marcarAgotado86(cmd.nombre, cmd.partida || currentStation, cmd.motivo);
        break;
      }
      case 'temporizador': {
        crearTemporizador(cmd.nombre, cmd.partida || currentStation, cmd.minutos || 5);
        break;
      }
      default: {
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: cmd.nombre,
          cantidad: 1,
          unidad: 'Kg',
          prioridad: 'Media',
          estado: 'Pendiente',
          partida: currentStation
        });
      }
    }

    // Cerrar tras éxito
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-900/95 to-[#0c0f17] border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse' 
                : 'bg-stone-800 text-stone-300'
            }`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-black tracking-wider text-amber-400">
                COMANDO POR VOZ
              </h2>
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                Control manos libres para cocina
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Support Check */}
        {!isSupported ? (
          <div className="my-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="block font-bold mb-1">Reconocimiento no disponible</strong>
              Tu navegador actual no tiene activada la Web Speech API nativa. Usa Safari en iOS o Chrome en Android con conexión segura (HTTPS).
            </div>
          </div>
        ) : (
          <div className="py-5 flex flex-col items-center">
            {/* Mic Pulse Center */}
            <div className="relative my-3 flex items-center justify-center">
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="absolute w-36 h-36 rounded-full border border-amber-500/30 animate-pulse" />
                </>
              )}
              
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 ring-8 ring-amber-500/20 scale-105'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 ring-4 ring-stone-700/50'
                }`}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-bounce" />
                ) : (
                  <MicOff className="w-9 h-9 opacity-80" />
                )}
              </button>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-amber-300 mt-2">
              {isListening ? '🎙️ Escuchando a la brigada...' : 'Pausa • Toca para hablar'}
            </span>

            {/* Transcription Box */}
            <div className="w-full mt-4 p-4 rounded-2xl bg-stone-900/80 border border-stone-800 text-center min-h-[70px] flex items-center justify-center">
              {transcript || interimTranscript ? (
                <p className="text-sm font-medium text-stone-200">
                  <span className="font-bold text-white">"{transcript}"</span>
                  {interimTranscript && (
                    <span className="text-amber-400/80 italic ml-1">...{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-stone-500 italic">
                  Habla ahora: "Agregar 5 kilos de cebolla a Garde Manger", "Comprar nata", "Fuera de carta merluza"...
                </p>
              )}
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="w-full mt-3 p-2.5 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1-Tap Confirmation Card */}
            {parsedCommand && (
              <div className="w-full mt-5 p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 border-2 border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    {parsedCommand.tipo === 'tarea' && <Flame className="w-4 h-4" />}
                    {parsedCommand.tipo === 'compra' && <ShoppingBag className="w-4 h-4" />}
                    {parsedCommand.tipo === 'agotado' && <Ban className="w-4 h-4" />}
                    {parsedCommand.tipo === 'temporizador' && <TimerIcon className="w-4 h-4" />}
                    {parsedCommand.tipo === 'tarea' && 'Mise en Place Detectada'}
                    {parsedCommand.tipo === 'compra' && 'Lista de Compras'}
                    {parsedCommand.tipo === 'agotado' && 'Agotado (Fuera de Carta)'}
                    {parsedCommand.tipo === 'temporizador' && 'Temporizador de Pase'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {Math.round(parsedCommand.confianza * 100)}% de acierto
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-black text-white capitalize leading-tight">
                      {parsedCommand.nombre}
                    </span>
                    {parsedCommand.cantidad !== undefined && (
                      <span className="text-sm font-black text-amber-400 shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        {parsedCommand.cantidad} {parsedCommand.unidad}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {parsedCommand.partida && (
                      <span className="font-bold px-2.5 py-1 rounded-lg bg-stone-800 text-stone-200 border border-stone-700 flex items-center gap-1">
                        Partida: <strong className="text-amber-400">{parsedCommand.partida}</strong>
                      </span>
                    )}
                    {parsedCommand.minutos !== undefined && (
                      <span className="font-bold px-2.5 py-1 rounded-lg bg-stone-800 text-amber-300 border border-amber-500/30">
                        ⏱️ {parsedCommand.minutos} minutos
                      </span>
                    )}
                    {parsedCommand.prioridad && (
                      <span className={`font-bold px-2.5 py-1 rounded-lg border ${
                        parsedCommand.prioridad === 'Critica' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}>
                        Prioridad: {parsedCommand.prioridad}
                      </span>
                    )}
                    {parsedCommand.categoria && (
                      <span className="font-bold px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700">
                        Cat: {parsedCommand.categoria}
                      </span>
                    )}
                  </div>
                </div>

                {/* 1-Tap Huge Touch Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => handleConfirmCommand(parsedCommand)}
                    className="sm:col-span-2 min-h-[52px] rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all active:scale-98"
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    Confirmar e Inyectar
                  </button>

                  <button
                    onClick={() => {
                      resetCommand();
                      startListening();
                    }}
                    className="min-h-[52px] rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Quick Cooking Voice Cheatsheet */}
            <div className="w-full mt-6 pt-4 border-t border-stone-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 mb-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>EJEMPLOS OPERATIVOS POR VOZ:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">📋</span>
                  <span>"Agregar <strong>5 kilos de cebolla picada a Garde Manger</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">🛒</span>
                  <span>"Comprar <strong>10 litros de nata</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">🛑</span>
                  <span>"Marcar <strong>fuera de carta rodaballo salvaje</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">⏱️</span>
                  <span>"Temporizador <strong>15 minutos arroz meloso</strong>"</span>
                </li>
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
