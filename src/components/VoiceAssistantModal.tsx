import { useEffect, useState } from 'react';
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
  HelpCircle,
  Plus,
  Minus
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
    partidas,
    agregarTarea,
    agregarCompra,
    marcarAgotado86,
    crearTemporizador
  } = useBrigadeStore();

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
  } = useVoiceCommander(currentStation, partidas);

  // Comando editable localmente para corregir cualquier detalle antes de confirmar
  const [editableCmd, setEditableCmd] = useState<ParsedVoiceCommand | null>(null);

  useEffect(() => {
    if (parsedCommand) {
      setEditableCmd({ ...parsedCommand });
    } else {
      setEditableCmd(null);
    }
  }, [parsedCommand]);

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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
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

  const handleConfirmCommand = () => {
    if (!editableCmd) return;
    playSuccessChime();

    const targetStation = editableCmd.partida || (partidas[0] || currentStation);

    switch (editableCmd.tipo) {
      case 'tarea': {
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: editableCmd.nombre,
          cantidad: editableCmd.cantidad || 1,
          unidad: editableCmd.unidad || 'Kg',
          prioridad: editableCmd.prioridad || 'Media',
          estado: 'Pendiente',
          partida: targetStation
        });
        break;
      }
      case 'compra': {
        agregarCompra({
          id: crypto.randomUUID(),
          ingrediente: editableCmd.nombre,
          cantidad: editableCmd.cantidad || 1,
          categoria: editableCmd.categoria || 'Vegetales'
        });
        break;
      }
      case 'agotado': {
        marcarAgotado86(editableCmd.nombre, targetStation, editableCmd.motivo);
        break;
      }
      case 'temporizador': {
        crearTemporizador(editableCmd.nombre, targetStation, editableCmd.minutos || 5);
        break;
      }
      default: {
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: editableCmd.nombre,
          cantidad: 1,
          unidad: 'Kg',
          prioridad: 'Media',
          estado: 'Pendiente',
          partida: targetStation
        });
      }
    }

    setTimeout(() => {
      onClose();
    }, 350);
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
                Control manos libres con tiempo de pausa
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
          <div className="py-4 flex flex-col items-center">
            {/* Mic Pulse Center */}
            <div className="relative my-2 flex items-center justify-center">
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
                title={isListening ? "Toca para pausar o procesar" : "Toca para reanudar escucha"}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-bounce" />
                ) : (
                  <MicOff className="w-9 h-9 opacity-80" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                {isListening ? '🎙️ Escuchando... puedes pausar y pensar' : 'Pausado • Toca para hablar'}
              </span>
            </div>

            {/* Transcription Box with Real-time Speech */}
            <div className="w-full mt-3 p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 text-center min-h-[60px] flex flex-col items-center justify-center gap-1">
              {transcript || interimTranscript ? (
                <p className="text-sm font-medium text-stone-200">
                  <span className="font-bold text-white">"{transcript}"</span>
                  {interimTranscript && (
                    <span className="text-amber-400/80 italic ml-1">...{interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-stone-500 italic">
                  Habla con calma. Puedes pensar entre palabras. Ejemplo: "Agregar 5 kilos de cebolla a {partidas[0] || 'la cocina'}"
                </p>
              )}

              {/* Action to force process right now without waiting */}
              {isListening && (transcript || interimTranscript) && (
                <button
                  onClick={stopListening}
                  className="mt-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  ⚡ He terminado, interpretar ahora
                </button>
              )}
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="w-full mt-3 p-2.5 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1-Tap & Editable Confirmation Card */}
            {editableCmd && (
              <div className="w-full mt-4 p-4 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border-2 border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    {editableCmd.tipo === 'tarea' && <Flame className="w-4 h-4" />}
                    {editableCmd.tipo === 'compra' && <ShoppingBag className="w-4 h-4" />}
                    {editableCmd.tipo === 'agotado' && <Ban className="w-4 h-4" />}
                    {editableCmd.tipo === 'temporizador' && <TimerIcon className="w-4 h-4" />}
                    {editableCmd.tipo === 'tarea' && 'Mise en Place Detectada'}
                    {editableCmd.tipo === 'compra' && 'Lista de Compras'}
                    {editableCmd.tipo === 'agotado' && 'Agotado (Fuera de Carta)'}
                    {editableCmd.tipo === 'temporizador' && 'Temporizador de Pase'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Editable • Revisa o Ajusta
                  </span>
                </div>

                {/* Editable Fields */}
                <div className="space-y-3 mb-4">
                  {/* Nombre editable */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                      Elaboración / Ítem:
                    </label>
                    <input
                      type="text"
                      value={editableCmd.nombre}
                      onChange={(e) => setEditableCmd({ ...editableCmd, nombre: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Cantidad y Unidad (para tareas y compras) */}
                  {(editableCmd.tipo === 'tarea' || editableCmd.tipo === 'compra') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                          Cantidad:
                        </label>
                        <div className="flex items-center gap-1 bg-stone-950 border border-stone-700 rounded-xl p-1">
                          <button
                            onClick={() => setEditableCmd({ ...editableCmd, cantidad: Math.max(0.5, (editableCmd.cantidad || 1) - 1) })}
                            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            value={editableCmd.cantidad || 1}
                            onChange={(e) => setEditableCmd({ ...editableCmd, cantidad: parseFloat(e.target.value) || 1 })}
                            className="flex-1 bg-transparent text-center font-black text-sm text-amber-400 focus:outline-none"
                          />
                          <button
                            onClick={() => setEditableCmd({ ...editableCmd, cantidad: (editableCmd.cantidad || 1) + 1 })}
                            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                          Unidad:
                        </label>
                        <select
                          value={editableCmd.unidad || 'Kg'}
                          onChange={(e) => setEditableCmd({ ...editableCmd, unidad: e.target.value })}
                          className="w-full h-10 bg-stone-950 border border-stone-700 rounded-xl px-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Kg">Kg</option>
                          <option value="Litros">Litros</option>
                          <option value="Gramos">Gramos</option>
                          <option value="Unidades">Unidades</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Minutos (para temporizadores) */}
                  {editableCmd.tipo === 'temporizador' && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                        Minutos de Cocción:
                      </label>
                      <div className="flex items-center gap-1 bg-stone-950 border border-stone-700 rounded-xl p-1 max-w-[200px]">
                        <button
                          onClick={() => setEditableCmd({ ...editableCmd, minutos: Math.max(1, (editableCmd.minutos || 5) - 1) })}
                          className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center font-black text-sm text-amber-400">
                          {editableCmd.minutos} min
                        </span>
                        <button
                          onClick={() => setEditableCmd({ ...editableCmd, minutos: (editableCmd.minutos || 5) + 1 })}
                          className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selector de Partida personalizada */}
                  {partidas.length > 0 && (editableCmd.tipo === 'tarea' || editableCmd.tipo === 'agotado' || editableCmd.tipo === 'temporizador') && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                        Partida Asignada:
                      </label>
                      <select
                        value={editableCmd.partida || partidas[0]}
                        onChange={(e) => setEditableCmd({ ...editableCmd, partida: e.target.value })}
                        className="w-full h-10 bg-stone-950 border border-stone-700 rounded-xl px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {partidas.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Prioridad (para tareas) */}
                  {editableCmd.tipo === 'tarea' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        Prioridad:
                      </span>
                      {(['Baja', 'Media', 'Critica'] as const).map(prio => (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setEditableCmd({ ...editableCmd, prioridad: prio })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            editableCmd.prioridad === prio
                              ? prio === 'Critica' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-400 hover:text-white'
                          }`}
                        >
                          {prio}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm and Retry Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleConfirmCommand}
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
            <div className="w-full mt-5 pt-4 border-t border-stone-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>EJEMPLOS CON TIEMPO DE PAUSA:</span>
              </div>
              <p className="text-[11px] text-stone-500 mb-2">
                Puedes hablar despacio. Si te equivocas, la tarjeta te permite corregir el número o la partida antes de confirmar.
              </p>
              <ul className="space-y-1.5 text-[11px] text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">📋</span>
                  <span>"Agregar <strong>5 kilos de cebolla picada a {partidas[0] || 'Garde Manger'}</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">🛒</span>
                  <span>"Comprar <strong>10 litros de nata</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">🛑</span>
                  <span>"Marcar <strong>fuera de carta rodaballo</strong>"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">⏱️</span>
                  <span>"Temporizador <strong>15 minutos horno</strong>"</span>
                </li>
              </ul>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
