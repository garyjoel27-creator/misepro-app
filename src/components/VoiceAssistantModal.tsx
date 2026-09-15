import { useEffect, useState, useRef, type ComponentType } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Check, 
  RotateCcw, 
  Flame, 
  ShoppingBag, 
  Ban, 
  Timer as TimerIcon, 
  AlertCircle,
  Plus,
  Minus,
  ChefHat,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import { useVoiceCommander, type ParsedVoiceCommand, type VoiceIntentType } from '../hooks/useVoiceCommander';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { type StationName, getStationConfig } from '../types/stations';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation?: StationName;
}

interface IntentOption {
  type: VoiceIntentType;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    type: 'tarea',
    label: 'Mise en Place',
    icon: Flame,
    accentColor: 'text-amber-400',
    activeBorder: 'border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
    activeBg: 'bg-amber-500/20 text-amber-300'
  },
  {
    type: 'compra',
    label: 'Compra Stock',
    icon: ShoppingBag,
    accentColor: 'text-emerald-400',
    activeBorder: 'border-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
    activeBg: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    type: 'agotado',
    label: 'Agotado (86)',
    icon: Ban,
    accentColor: 'text-red-400',
    activeBorder: 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.35)]',
    activeBg: 'bg-red-500/20 text-red-300'
  },
  {
    type: 'temporizador',
    label: 'Temporizador',
    icon: TimerIcon,
    accentColor: 'text-cyan-400',
    activeBorder: 'border-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.35)]',
    activeBg: 'bg-cyan-500/20 text-cyan-300'
  }
];

const UNIT_PRESETS = ['Kg', 'Litros', 'Gramos', 'Unidades', 'Raciones'];
const QUANTITY_INCREMENTS = [0.5, 1, 2, 5, 10];
const TIMER_PRESETS = [3, 5, 8, 10, 15, 20, 30, 45];
const COMPRA_CATEGORIES = ['Vegetales', 'Proteinas', 'Lacteos/Secos'] as const;

export function VoiceAssistantModal({ isOpen, onClose, currentStation = 'Saucier' }: VoiceAssistantModalProps) {
  const {
    partidas,
    coloresPartidas,
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
    resetCommand,
    forceParseNow,
    applyCustomText
  } = useVoiceCommander(currentStation, partidas);

  // Estado del comando interactivo en el "cuadradito"
  const [editableCmd, setEditableCmd] = useState<ParsedVoiceCommand | null>(null);
  
  // Bandera para proteger las ediciones manuales del usuario frente al habla continua
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar comando interpretado solo si el usuario no está editando manualmente
  useEffect(() => {
    if (!hasUserEdited && parsedCommand) {
      setEditableCmd({ ...parsedCommand });
    }
  }, [parsedCommand, hasUserEdited]);

  // Si no hay comando editable pero hay partida, crear uno base por defecto si se abre
  useEffect(() => {
    if (isOpen && !editableCmd) {
      setEditableCmd({
        tipo: 'tarea',
        rawText: '',
        nombre: '',
        cantidad: 1,
        unidad: 'Kg',
        partida: partidas[0] || currentStation,
        prioridad: 'Media',
        confianza: 0.5
      });
    }
  }, [isOpen, partidas, currentStation, editableCmd]);

  // Control del ciclo de escucha al abrir / cerrar
  useEffect(() => {
    if (isOpen && isSupported) {
      setHasUserEdited(false);
      startListening();
    } else {
      stopListening();
      resetCommand();
      setHasUserEdited(false);
      setEditableCmd(null);
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

  const handleSelectIntent = (tipo: VoiceIntentType) => {
    setHasUserEdited(true);
    stopListening(); // Pausar para que el cocinero configure tranquilo
    setEditableCmd(prev => {
      const baseName = prev?.nombre || '';
      const basePartida = prev?.partida || partidas[0] || currentStation;
      return {
        tipo,
        rawText: prev?.rawText || '',
        nombre: baseName,
        cantidad: prev?.cantidad || 1,
        unidad: prev?.unidad || 'Kg',
        partida: basePartida,
        prioridad: prev?.prioridad || 'Media',
        minutos: prev?.minutos || 5,
        categoria: prev?.categoria || 'Vegetales',
        motivo: prev?.motivo || 'Agotado durante servicio',
        confianza: 1
      };
    });
  };

  const handleUpdateField = (partial: Partial<ParsedVoiceCommand>) => {
    setHasUserEdited(true);
    setEditableCmd(prev => (prev ? { ...prev, ...partial } : null));
  };

  const handleConfirmCommand = () => {
    if (!editableCmd || !editableCmd.nombre.trim()) return;
    playSuccessChime();

    const targetStation = editableCmd.partida || (partidas[0] || currentStation);

    switch (editableCmd.tipo) {
      case 'tarea': {
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: editableCmd.nombre.trim(),
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
          ingrediente: editableCmd.nombre.trim(),
          cantidad: editableCmd.cantidad || 1,
          categoria: editableCmd.categoria || 'Vegetales'
        });
        break;
      }
      case 'agotado': {
        marcarAgotado86(editableCmd.nombre.trim(), targetStation, editableCmd.motivo || 'Agotado en servicio');
        break;
      }
      case 'temporizador': {
        crearTemporizador(editableCmd.nombre.trim(), targetStation, editableCmd.minutos || 5);
        break;
      }
    }

    setTimeout(() => {
      onClose();
    }, 320);
  };

  const handleResetSession = () => {
    setHasUserEdited(false);
    resetCommand();
    setEditableCmd({
      tipo: 'tarea',
      rawText: '',
      nombre: '',
      cantidad: 1,
      unidad: 'Kg',
      partida: partidas[0] || currentStation,
      prioridad: 'Media',
      confianza: 0.5
    });
    startListening();
  };

  const handleApplyTemplate = (sampleText: string) => {
    setHasUserEdited(false);
    applyCustomText(sampleText);
    stopListening();
  };

  const activeIntent = editableCmd?.tipo || 'tarea';
  const currentIntentConfig = INTENT_OPTIONS.find(o => o.type === activeIntent) || INTENT_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200">
      
      {/* CUADRADITO DE VOZ INTERACTIVO */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-900/98 via-stone-900/95 to-[#0b0f19] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Barra Superior Ejecutiva */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
                : 'bg-stone-800 text-stone-300'
            }`}>
              <currentIntentConfig.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-black tracking-wider text-amber-400">
                  CUADRADITO DE VOZ PRO
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v2.0 Táctil
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                Centro Interactivo Manos Libres
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            title="Cerrar asistente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sin soporte en el navegador */}
        {!isSupported ? (
          <div className="my-5 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="block font-bold mb-1">Reconocimiento no disponible</strong>
              Tu navegador no tiene la Web Speech API activa. Usa Safari en iOS o Chrome en Android en conexión HTTPS. Puedes usar el teclado interactivo abajo.
            </div>
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center">
            
            {/* Visualizador de Ondas de Audio & Botón Central */}
            <div className="relative my-2 flex flex-col items-center justify-center w-full">
              {/* Ondas Dinámicas (Soundwave Frequency Bars) */}
              <div className="flex items-center justify-center gap-1.5 h-10 my-1">
                {[12, 22, 32, 16, 26, 38, 24, 34, 18, 28, 20, 36, 18, 14].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                        : 'bg-stone-700 h-2 opacity-35'
                    }`}
                    style={{
                      height: isListening ? `${h}px` : '5px',
                      animationDelay: `${(i % 5) * 140}ms`,
                      animationDuration: `${650 + (i % 3) * 200}ms`
                    }}
                  />
                ))}
              </div>

              {/* Botón Central Micrófono con Pulso Táctil */}
              <div className="relative my-1 flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping" />
                    <div className="absolute w-32 h-32 rounded-full border border-amber-500/30 animate-pulse" />
                  </>
                )}
                
                <button
                  onClick={isListening ? stopListening : () => { setHasUserEdited(false); startListening(); }}
                  className={`relative w-18 h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                    isListening
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 ring-8 ring-amber-500/20 scale-105'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 ring-4 ring-stone-700/50'
                  }`}
                  title={isListening ? "Pausar micrófono" : "Tocar para activar micrófono"}
                >
                  {isListening ? (
                    <Mic className="w-8 h-8 animate-bounce stroke-[2.3]" />
                  ) : (
                    <MicOff className="w-8 h-8 opacity-75" />
                  )}
                </button>
              </div>

              {/* Indicador de Estado */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isListening
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : 'bg-stone-800/80 text-stone-400 border-stone-700'
                }`}>
                  {isListening ? '🎙️ Escuchando... habla con calma' : '⏸️ Micrófono pausado • Puedes editar'}
                </span>
              </div>
            </div>

            {/* Caja de Transcripción Limpia (Sin duplicaciones) */}
            <div className="w-full mt-2 p-3 rounded-2xl bg-stone-950/80 border border-stone-800/90 text-center min-h-[50px] flex flex-col items-center justify-center gap-1 shadow-inner">
              {transcript || interimTranscript ? (
                <div className="w-full flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-medium text-stone-200 text-left flex-1 line-clamp-2">
                    <span className="font-bold text-white">"{transcript}"</span>
                    {interimTranscript && (
                      <span className="text-amber-400 italic ml-1 font-semibold">...{interimTranscript}</span>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {isListening && (
                      <button
                        onClick={forceParseNow}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        title="Interpretar texto de inmediato"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Ya</span>
                      </button>
                    )}
                    <button
                      onClick={handleResetSession}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
                      title="Borrar texto y reiniciar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-stone-500 italic">
                  Di por ejemplo: <span className="text-stone-300">"Agregar 5 kilos de cebolla a {partidas[0] || 'la cocina'}"</span>
                </p>
              )}
            </div>

            {/* Mensaje de Error si hay */}
            {errorMessage && (
              <div className="w-full mt-2 p-2 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-[11px] text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* SELECTOR SEGMENTADO DE INTENCIÓN (4 CHIPS TÁCTILES GRANDES) */}
            <div className="w-full mt-3.5">
              <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Tipo de Registro en Cocina:</span>
                <span className="text-amber-400/80 font-medium lowercase">toca para cambiar</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {INTENT_OPTIONS.map(opt => {
                  const isSelected = activeIntent === opt.type;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => handleSelectIntent(opt.type)}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? `${opt.activeBorder} ${opt.activeBg} font-black scale-[1.02]`
                          : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TARJETA INTERACTIVA DE EDICIÓN RÁPIDA (EL CUADRADITO) */}
            {editableCmd && (
              <div className="w-full mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-stone-950/90 border border-stone-800 shadow-xl space-y-3">
                
                {/* 1. Nombre / Elaboración con botón de limpiar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {activeIntent === 'tarea' && 'Nombre de Elaboración:'}
                      {activeIntent === 'compra' && 'Ingrediente a Comprar:'}
                      {activeIntent === 'agotado' && 'Plato / Ingrediente Agotado:'}
                      {activeIntent === 'temporizador' && 'Concepto del Temporizador:'}
                    </label>
                    {editableCmd.nombre && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateField({ nombre: '' });
                          inputRef.current?.focus();
                        }}
                        className="text-[10px] text-stone-400 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Borrar</span>
                      </button>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editableCmd.nombre}
                      placeholder={
                        activeIntent === 'tarea' ? 'Ej: Cebolla pochada' :
                        activeIntent === 'compra' ? 'Ej: Nata 35% MG' :
                        activeIntent === 'agotado' ? 'Ej: Lubina salvaje' :
                        'Ej: Fondo de carne'
                      }
                      onChange={(e) => handleUpdateField({ nombre: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
                    />
                  </div>
                </div>

                {/* 2. Cantidad y Unidad (Para Tarea y Compra) */}
                {(activeIntent === 'tarea' || activeIntent === 'compra') && (
                  <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        Cantidad:
                      </span>

                      {/* Stepper Táctil */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateField({ cantidad: Math.max(0.5, (editableCmd.cantidad || 1) - 0.5) })}
                          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center cursor-pointer border border-stone-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="min-w-[50px] text-center font-black text-lg text-amber-400">
                          {editableCmd.cantidad || 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUpdateField({ cantidad: (editableCmd.cantidad || 1) + 0.5 })}
                          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center cursor-pointer border border-stone-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chips de Incrementos Rápidos */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[9px] uppercase font-bold text-stone-500 shrink-0">Chips:</span>
                      {QUANTITY_INCREMENTS.map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => handleUpdateField({ cantidad: inc })}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                            editableCmd.cantidad === inc
                              ? 'bg-amber-500 text-stone-950 border-amber-400'
                              : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                          }`}
                        >
                          {inc}
                        </button>
                      ))}
                    </div>

                    {/* Chips de Unidades */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-500 block mb-1">Unidad de Medida:</span>
                      <div className="flex flex-wrap gap-1">
                        {UNIT_PRESETS.map(u => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => handleUpdateField({ unidad: u })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              (editableCmd.unidad || 'Kg') === u
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-black'
                                : 'bg-stone-800 text-stone-400 border-stone-700/60 hover:text-white'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Minutos y Presets (Para Temporizadores) */}
                {activeIntent === 'temporizador' && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
                        Minutos de Cocción:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateField({ minutos: Math.max(1, (editableCmd.minutos || 5) - 1) })}
                          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center cursor-pointer border border-stone-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="min-w-[60px] text-center font-black text-xl text-cyan-400">
                          {editableCmd.minutos || 5} min
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateField({ minutos: (editableCmd.minutos || 5) + 1 })}
                          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center cursor-pointer border border-stone-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Presets de Temporizador */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {TIMER_PRESETS.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleUpdateField({ minutos: m })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            (editableCmd.minutos || 5) === m
                              ? 'bg-cyan-500 text-stone-950 border-cyan-400 font-black'
                              : 'bg-stone-900 text-cyan-200/70 border-cyan-900/60 hover:bg-cyan-900/40'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Categoría (Para Compras) */}
                {activeIntent === 'compra' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
                      Categoría de Proveedor:
                    </label>
                    <div className="flex gap-1.5">
                      {COMPRA_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleUpdateField({ categoria: cat })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            (editableCmd.categoria || 'Vegetales') === cat
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-black'
                              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Selector de Partidas Personalizadas (Tarea, Agotado, Temporizador) */}
                {(activeIntent === 'tarea' || activeIntent === 'agotado' || activeIntent === 'temporizador') && partidas.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5 flex items-center gap-1">
                      <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                      <span>Partida Asignada:</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {partidas.map(st => {
                        const isSelected = (editableCmd.partida || partidas[0]) === st;
                        const config = getStationConfig(st, coloresPartidas[st]);
                        const Icon = config.icon;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateField({ partida: st })}
                            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-black scale-[1.02]'
                                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{st}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Selector de Prioridad (Solo Tareas) */}
                {activeIntent === 'tarea' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nivel de Prioridad:</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Baja', 'Media', 'Critica'] as const).map(prio => {
                        const isSel = (editableCmd.prioridad || 'Media') === prio;
                        return (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => handleUpdateField({ prioridad: prio })}
                            className={`min-h-[36px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                              isSel
                                ? prio === 'Critica'
                                  ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-950 font-black'
                                  : prio === 'Media'
                                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                                  : 'bg-stone-700 text-white border-stone-600 font-black'
                                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                            }`}
                          >
                            {prio === 'Critica' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />}
                            <span>{prio === 'Critica' ? 'Crítica' : prio}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botones de Acción Primaria */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleConfirmCommand}
                    disabled={!editableCmd.nombre.trim()}
                    className={`sm:col-span-2 min-h-[50px] rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-98 ${
                      editableCmd.nombre.trim()
                        ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-950/60'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>Confirmar e Inyectar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSession}
                    className="min-h-[50px] rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-stone-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Atajos Rápidos de Cocina (Plantillas 1-Toque sin hablar) */}
            <div className="w-full mt-4 pt-3 border-t border-stone-800/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 mb-2">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ATAJOS DIRECTOS 1-TOQUE (SIN VOZ):
                </span>
                <span className="text-[10px] text-stone-500 font-normal">Toca para cargar</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { text: `5 Kg Cebolla a ${partidas[0] || 'Garde Manger'}`, label: '🧅 5 Kg Cebolla' },
                  { text: 'Comprar 10 litros de nata', label: '🥛 Comprar Nata' },
                  { text: 'Agotado Lubina salvaje', label: '🛑 Agotado Lubina' },
                  { text: 'Temporizador 15 minutos horno', label: '⏱️ Horno 15 min' }
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleApplyTemplate(item.text)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
