import { useEffect, useState, useRef, useCallback, useMemo, type ComponentType } from 'react';
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
  Tag,
  Volume2
} from 'lucide-react';
import { 
  playSuccessChime, 
  playCancelChime,
  playAlertChime,
  locateExistingItem,
  type ParsedVoiceCommand, 
  type VoiceIntentType,
  type VoiceCommanderController
} from '../hooks/useVoiceCommander';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { type StationName, getStationConfig } from '../types/stations';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStation?: StationName;
  initialCommand?: ParsedVoiceCommand | null;
  initialText?: string;
  isWakeWordTriggered?: boolean;
  voiceCommander: VoiceCommanderController;
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

export function VoiceAssistantModal({ 
  isOpen, 
  onClose, 
  currentStation = 'Saucier',
  initialCommand = null,
  initialText = '',
  isWakeWordTriggered = false,
  voiceCommander
}: VoiceAssistantModalProps) {
  const {
    partidas,
    coloresPartidas,
    kanbanTareas,
    comprasPendientes,
    agotados86,
    agregarTarea,
    actualizarTarea,
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
    applyCustomText,
    registerVoiceActions
  } = voiceCommander;

  // Estado del comando interactivo en el "cuadradito"
  const [editableCmd, setEditableCmd] = useState<ParsedVoiceCommand | null>(() => {
    if (initialCommand) return initialCommand;
    return null;
  });
  
  // Bandera para proteger las ediciones manuales del usuario frente al habla continua
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [autoConfirmSeconds, setAutoConfirmSeconds] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoConfirmTimerRef = useRef<any>(null);
  const lastAlertedIdRef = useRef<string | null>(null);

  // Localizar en tiempo real si el elemento ya existe en la brigada ("localice que ya lo tiene")
  const locatedMatch = useMemo(() => {
    if (!editableCmd?.nombre || editableCmd.nombre.trim().length < 2) return null;
    return locateExistingItem(
      editableCmd.nombre,
      editableCmd.partida || (partidas[0] || currentStation),
      kanbanTareas,
      comprasPendientes,
      agotados86
    );
  }, [editableCmd, currentStation, partidas, kanbanTareas, comprasPendientes, agotados86]);

  // Alerta sonora sutil cuando se localiza un item existente
  useEffect(() => {
    if (locatedMatch && lastAlertedIdRef.current !== locatedMatch.id) {
      lastAlertedIdRef.current = locatedMatch.id;
      playAlertChime();
    }
  }, [locatedMatch]);

  const handleConfirmCommand = useCallback(() => {
    if (!editableCmd || !editableCmd.nombre.trim()) return;
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    playSuccessChime();

    const targetStation = editableCmd.partida || (partidas[0] || currentStation);

    switch (editableCmd.tipo) {
      case 'tarea': {
        const isAccion = editableCmd.tipoTarea === 'accion';
        agregarTarea({
          id: crypto.randomUUID(),
          nombre: editableCmd.nombre.trim(),
          tipo: isAccion ? 'accion' : 'elaboracion',
          cantidad: isAccion ? undefined : (editableCmd.cantidad || 1),
          unidad: isAccion ? undefined : (editableCmd.unidad || 'Kg'),
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
    }, 280);
  }, [editableCmd, partidas, currentStation, agregarTarea, agregarCompra, marcarAgotado86, crearTemporizador, onClose]);

  // Acción inteligente: Sumar cantidad a la tarea/compra ya existente
  const handleSumToExisting = useCallback(() => {
    if (!locatedMatch) return;
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    playSuccessChime();

    if (locatedMatch.type === 'tarea') {
      const addedQty = editableCmd?.cantidad || 1;
      const currentQty = locatedMatch.cantidad || 0;
      actualizarTarea(locatedMatch.id, {
        cantidad: currentQty + addedQty
      });
    } else if (locatedMatch.type === 'compra') {
      const addedQty = editableCmd?.cantidad || 1;
      const currentQty = locatedMatch.cantidad || 0;
      agregarCompra({
        id: crypto.randomUUID(),
        ingrediente: locatedMatch.nombre,
        cantidad: currentQty + addedQty,
        categoria: editableCmd?.categoria || 'Vegetales'
      });
    }

    setTimeout(() => {
      onClose();
    }, 280);
  }, [locatedMatch, editableCmd, actualizarTarea, agregarCompra, onClose]);

  const handleVoiceToggleTipo = useCallback(() => {
    setHasUserEdited(true);
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    setEditableCmd(prev => {
      if (!prev) return null;
      const nextTipo = prev.tipoTarea === 'accion' ? 'elaboracion' : 'accion';
      return { ...prev, tipoTarea: nextTipo };
    });
  }, []);

  // Registrar callbacks de control por voz en el hook unificado
  useEffect(() => {
    if (isOpen) {
      registerVoiceActions({
        onConfirm: () => handleConfirmCommand(),
        onCancel: () => {
          if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
          playCancelChime();
          onClose();
        },
        onToggleTipo: () => handleVoiceToggleTipo(),
        onSumExisting: () => handleSumToExisting()
      });
    }
    return () => {
      registerVoiceActions({});
    };
  }, [isOpen, handleConfirmCommand, handleVoiceToggleTipo, handleSumToExisting, onClose, registerVoiceActions]);

  // Sincronizar comando interpretado solo si el usuario no está editando manualmente
  useEffect(() => {
    if (!hasUserEdited && parsedCommand) {
      setEditableCmd(parsedCommand);
    }
  }, [parsedCommand, hasUserEdited]);

  const hasInitializedRef = useRef(false);

  // Si se abre y se pasa initialCommand o initialText
  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        if (initialCommand) {
          setEditableCmd(initialCommand);
        } else if (initialText) {
          applyCustomText(initialText);
        } else {
          setEditableCmd({
            tipo: 'tarea',
            tipoTarea: 'elaboracion',
            rawText: '',
            nombre: '',
            cantidad: 1,
            unidad: 'Kg',
            partida: partidas[0] || currentStation,
            prioridad: 'Media',
            confianza: 0.5
          });
        }
      }
    } else {
      hasInitializedRef.current = false;
    }
  }, [isOpen, initialCommand, initialText, applyCustomText, partidas, currentStation]);

  // Si fue disparado por Wake Word y tiene un comando válido, activar cuenta regresiva de auto-inyección manos libres
  useEffect(() => {
    if (isOpen && isWakeWordTriggered && editableCmd?.nombre && !hasUserEdited) {
      setAutoConfirmSeconds(4);
      autoConfirmTimerRef.current = setInterval(() => {
        setAutoConfirmSeconds(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(autoConfirmTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
      };
    } else {
      if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
      setAutoConfirmSeconds(null);
    }
  }, [isOpen, isWakeWordTriggered, editableCmd?.nombre, hasUserEdited]);

  // Disparar auto-confirmación cuando llega a 0
  useEffect(() => {
    if (autoConfirmSeconds === 0 && editableCmd?.nombre) {
      handleConfirmCommand();
    }
  }, [autoConfirmSeconds, editableCmd?.nombre, handleConfirmCommand]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setHasUserEdited(false);
      setEditableCmd(null);
      if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
      setAutoConfirmSeconds(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectIntent = (tipo: VoiceIntentType) => {
    setHasUserEdited(true);
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    stopListening();
    setEditableCmd(prev => {
      const baseName = prev?.nombre || '';
      const basePartida = prev?.partida || partidas[0] || currentStation;
      return {
        tipo,
        tipoTarea: prev?.tipoTarea || 'elaboracion',
        rawText: prev?.rawText || '',
        nombre: baseName,
        cantidad: prev?.cantidad || 1,
        unidad: prev?.unidad || 'Kg',
        partida: basePartida,
        prioridad: prev?.prioridad || 'Media',
        minutos: prev?.minutos || 5,
        categoria: prev?.categoria || 'Vegetales',
        confianza: 1
      };
    });
  };

  const handleUpdateField = (partial: Partial<ParsedVoiceCommand>) => {
    setHasUserEdited(true);
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    setEditableCmd(prev => (prev ? { ...prev, ...partial } : null));
  };

  const handleResetSession = () => {
    setHasUserEdited(false);
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
    resetCommand();
    setEditableCmd({
      tipo: 'tarea',
      tipoTarea: 'elaboracion',
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
    if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
    setAutoConfirmSeconds(null);
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
                {isWakeWordTriggered && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    Oye Chef 🎙️
                  </span>
                )}
                {!isWakeWordTriggered && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    v2.9 Manos Libres
                  </span>
                )}
              </div>
              <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                Control Manos Libres y Táctil
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            title="Cerrar asistente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Cuenta Regresiva de Auto-Inyección (Manos Libres) */}
        {autoConfirmSeconds !== null && autoConfirmSeconds > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <div className="text-xs font-bold">
                <span>Inyectando en </span>
                <span className="text-sm font-black font-mono text-emerald-200">{autoConfirmSeconds}s</span>
                <span className="block text-[10px] font-medium text-emerald-400/80">Di "Listo", "Sumar" o "Cancelar"</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
                  setAutoConfirmSeconds(null);
                  setHasUserEdited(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer"
              >
                Pausar
              </button>
              <button
                type="button"
                onClick={handleConfirmCommand}
                className="px-3 py-1 rounded-lg bg-emerald-500 text-stone-950 text-xs font-black uppercase cursor-pointer"
              >
                Inyectar Ya
              </button>
            </div>
          </div>
        )}

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

              {/* Indicador de Estado y Atajos por Voz */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isListening
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : 'bg-stone-800/80 text-stone-400 border-stone-700'
                }`}>
                  {isListening ? '🎙️ Escuchando... habla con calma' : '⏸️ Micrófono pausado • Puedes editar'}
                </span>

                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>Di <strong className="text-white">"Confirmar"</strong>, <strong className="text-white">"Sumar"</strong>, <strong className="text-white">"Cancelar"</strong> o <strong className="text-white">"Acción"</strong></span>
                </div>
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
                  Di por ejemplo: <span className="text-stone-300">"Falta agregar cortar puerros"</span> o <span className="text-stone-300">"Falta comprar 5 kilos de cebolla"</span>
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
                
                {/* Selector Táctil: Acción vs Elaboración (Solo para Mise en Place / Tarea) */}
                {activeIntent === 'tarea' && (
                  <div className="p-1 rounded-xl bg-stone-900 border border-stone-800 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateField({ tipoTarea: 'accion' })}
                      className={`flex-1 min-h-[40px] py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        editableCmd.tipoTarea === 'accion'
                          ? 'bg-sky-500 text-stone-950 shadow-md shadow-sky-950/40 scale-[1.01]'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>⚡ Acción Operativa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateField({ 
                        tipoTarea: 'elaboracion',
                        cantidad: editableCmd.cantidad || 1,
                        unidad: editableCmd.unidad || 'Kg'
                      })}
                      className={`flex-1 min-h-[40px] py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        editableCmd.tipoTarea !== 'accion'
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/40 scale-[1.01]'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span>⚖️ Elaboración Pesada</span>
                    </button>
                  </div>
                )}

                {/* 1. Nombre / Elaboración con botón de limpiar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {activeIntent === 'tarea' && (editableCmd.tipoTarea === 'accion' ? 'Nombre de la Acción:' : 'Nombre de Elaboración:')}
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
                        activeIntent === 'tarea' 
                          ? (editableCmd.tipoTarea === 'accion' ? 'Ej: Cortar verduras para la ensalada' : 'Ej: Fondo Oscuro') :
                        activeIntent === 'compra' ? 'Ej: Nata 35% MG' :
                        activeIntent === 'agotado' ? 'Ej: Lubina salvaje' :
                        'Ej: Fondo de carne'
                      }
                      onChange={(e) => handleUpdateField({ nombre: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-xl px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
                    />
                  </div>
                </div>

                {/* Banner Inteligente: Item Ya Localizado en el Sistema ("localice que ya lo tiene") */}
                {locatedMatch && (
                  <div className="p-3 rounded-2xl bg-amber-950/70 border-2 border-amber-500/70 text-amber-200 flex flex-col gap-2 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl shrink-0 mt-0.5">📍</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                              ¡Ya localizado en {locatedMatch.partida || 'Cocina'}!
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              locatedMatch.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              locatedMatch.estado === 'En Proceso' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {locatedMatch.estado || locatedMatch.type}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white mt-0.5">
                            "{locatedMatch.nombre}"
                            {locatedMatch.cantidad !== undefined ? ` • ${locatedMatch.cantidad} ${locatedMatch.unidad || 'Kg'}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-amber-500/30">
                      {locatedMatch.type === 'tarea' && locatedMatch.tipoTarea !== 'accion' && (
                        <button
                          type="button"
                          onClick={handleSumToExisting}
                          className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                        >
                          <span>➕ Sumar {(editableCmd?.cantidad || 1)} {editableCmd?.unidad || 'Kg'} a existente</span>
                        </button>
                      )}
                      <span className="text-[10px] text-stone-400 italic">o confirma para crear nueva</span>
                    </div>
                  </div>
                )}

                {/* Banner Informativo para Acción Operativa (sin kilos) */}
                {activeIntent === 'tarea' && editableCmd.tipoTarea === 'accion' && (
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2.5">
                    <span className="text-lg">⚡</span>
                    <div>
                      <span className="font-bold block text-sky-300">Acción Operativa Pura</span>
                      <span className="text-[11px] text-sky-400/80">Sin unidades métricas. Lista para ejecución inmediata por la brigada.</span>
                    </div>
                  </div>
                )}

                {/* 2. Cantidad y Unidad (Para Elaboración Pesada y Compra) */}
                {((activeIntent === 'tarea' && editableCmd.tipoTarea !== 'accion') || activeIntent === 'compra') && (
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

                {/* 5. Selector de Partidas Personalizadas */}
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
                  { text: `Falta picar cebolla`, label: '⚡ Picar Cebolla' },
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
