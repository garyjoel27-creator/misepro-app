import { useState, useEffect, useRef, useCallback } from 'react';
import type { StationName } from '../types/stations';

export type VoiceIntentType = 'tarea' | 'compra' | 'agotado' | 'temporizador' | 'desconocido';

export interface ParsedVoiceCommand {
  tipo: VoiceIntentType;
  rawText: string;
  nombre: string;
  cantidad?: number;
  unidad?: string;
  partida?: StationName;
  prioridad?: 'Critica' | 'Media' | 'Baja';
  minutos?: number;
  categoria?: 'Vegetales' | 'Proteinas' | 'Lacteos/Secos';
  motivo?: string;
  confianza: number; // 0 to 1
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function parseVoiceCommand(
  text: string, 
  defaultStation: StationName = 'Saucier',
  availableStations: string[] = []
): ParsedVoiceCommand {
  const clean = text.trim().toLowerCase();
  if (!clean) {
    return {
      tipo: 'desconocido',
      rawText: '',
      nombre: '',
      confianza: 0
    };
  }
  
  // 1. Detectar Intención: TEMPORIZADOR
  if (
    clean.includes('temporizador') || 
    clean.includes('alarma') || 
    clean.includes('cronómetro') || 
    clean.includes('cronometro') ||
    clean.includes('minuto') ||
    clean.includes('avísame') ||
    clean.includes('avisame')
  ) {
    const minMatch = clean.match(/(\d+)\s*(minutos?|min|m)/i) || clean.match(/(\d+)/);
    const minutos = minMatch ? parseInt(minMatch[1], 10) : 5;
    
    let nombre = clean
      .replace(/temporizador/gi, '')
      .replace(/alarma/gi, '')
      .replace(/cron[oó]metro/gi, '')
      .replace(/para/gi, '')
      .replace(/de/gi, '')
      .replace(/(\d+)\s*(minutos?|min|m)?/gi, '')
      .replace(/av[ií]same en/gi, '')
      .trim();
      
    if (!nombre) nombre = 'Cocción ' + minutos + ' min';
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    return {
      tipo: 'temporizador',
      rawText: text,
      nombre,
      minutos,
      partida: detectPartida(clean, availableStations) || defaultStation,
      confianza: 0.95
    };
  }

  // 2. Detectar Intención: AGOTADO / 86 / FUERA DE CARTA
  if (
    clean.includes('agotado') || 
    clean.includes('fuera de carta') || 
    clean.includes('se acabó') || 
    clean.includes('se acabo') || 
    clean.includes('terminó') ||
    clean.includes('termino') ||
    clean.includes('86') ||
    clean.includes('no queda') ||
    clean.includes('marcar agotado')
  ) {
    let nombre = clean
      .replace(/marcar agotado/gi, '')
      .replace(/marcar fuera de carta/gi, '')
      .replace(/fuera de carta/gi, '')
      .replace(/agotado/gi, '')
      .replace(/se acab[oó]/gi, '')
      .replace(/no queda/gi, '')
      .replace(/el /gi, '')
      .replace(/la /gi, '')
      .replace(/los /gi, '')
      .replace(/las /gi, '')
      .trim();

    if (!nombre) nombre = 'Plato o ingrediente';
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    return {
      tipo: 'agotado',
      rawText: text,
      nombre,
      partida: detectPartida(clean, availableStations) || defaultStation,
      motivo: 'Agotado durante el servicio (Voz)',
      confianza: 0.9
    };
  }

  // 3. Detectar Intención: COMPRA / PEDIDO
  if (
    clean.includes('comprar') || 
    clean.includes('compra') || 
    clean.includes('pedir') || 
    clean.includes('pedido') ||
    clean.includes('falta') ||
    clean.includes('anotar compra') ||
    clean.includes('apuntar compra')
  ) {
    const { cantidad, unidad, textoRestante } = extractQuantityAndUnit(clean);
    
    let nombre = textoRestante
      .replace(/anotar compra/gi, '')
      .replace(/apuntar compra/gi, '')
      .replace(/comprar/gi, '')
      .replace(/compra/gi, '')
      .replace(/pedir/gi, '')
      .replace(/pedido/gi, '')
      .replace(/falta/gi, '')
      .replace(/^de /gi, '')
      .trim();

    if (!nombre) nombre = 'Ingrediente';
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    const categoria = deduceCategory(nombre);

    return {
      tipo: 'compra',
      rawText: text,
      nombre,
      cantidad: cantidad || 1,
      unidad: unidad || 'Kg',
      categoria,
      confianza: 0.88
    };
  }

  // 4. Intención por Defecto: TAREA / MISE EN PLACE
  const { cantidad, unidad, textoRestante } = extractQuantityAndUnit(clean);
  const partida = detectPartida(clean, availableStations) || defaultStation;
  
  let nombre = textoRestante
    .replace(/agregar/gi, '')
    .replace(/añadir/gi, '')
    .replace(/crear/gi, '')
    .replace(/hacer/gi, '')
    .replace(/preparar/gi, '')
    .replace(/a la partida de/gi, '')
    .replace(/en la partida de/gi, '')
    .replace(/a la partida/gi, '')
    .replace(/en la partida/gi, '')
    .replace(/prioridad urgente/gi, '')
    .replace(/prioridad crítica/gi, '')
    .replace(/prioridad critica/gi, '')
    .replace(/prioridad media/gi, '')
    .replace(/prioridad baja/gi, '')
    .replace(/urgente/gi, '')
    .replace(/^de /gi, '');

  // Quitar el nombre de la partida si se mencionó explícitamente
  if (partida) {
    const regPartida = new RegExp(`(a |en )?${partida}`, 'gi');
    nombre = nombre.replace(regPartida, '');
  }

  nombre = nombre.trim();
  if (!nombre) nombre = clean;
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

  let prioridad: 'Critica' | 'Media' | 'Baja' = 'Media';
  if (clean.includes('urgente') || clean.includes('crítica') || clean.includes('critica') || clean.includes('alta')) {
    prioridad = 'Critica';
  } else if (clean.includes('baja') || clean.includes('tranquilo') || clean.includes('después')) {
    prioridad = 'Baja';
  }

  return {
    tipo: 'tarea',
    rawText: text,
    nombre,
    cantidad: cantidad || 1,
    unidad: unidad || 'Kg',
    partida,
    prioridad,
    confianza: clean.length > 3 ? 0.92 : 0.4
  };
}

function detectPartida(text: string, availableStations: string[] = []): StationName | null {
  // 1. Comparar primero contra las partidas personalizadas reales del usuario
  for (const st of availableStations) {
    if (text.includes(st.toLowerCase())) {
      return st;
    }
  }

  // 2. Mapeo clásico de respaldo
  if (text.includes('saucier') || text.includes('salsa') || text.includes('fondo') || text.includes('caldo')) {
    return availableStations.find(s => s.toLowerCase() === 'saucier') || 'Saucier';
  }
  if (text.includes('garde manger') || text.includes('cuarto frío') || text.includes('cuarto frio') || text.includes('ensalada') || text.includes('vegetal')) {
    return availableStations.find(s => s.toLowerCase() === 'garde manger') || 'Garde Manger';
  }
  if (text.includes('pescado') || text.includes('poissonier') || text.includes('marisco') || text.includes('mar') || text.includes('pescados')) {
    return availableStations.find(s => s.toLowerCase() === 'pescados') || 'Pescados';
  }
  if (text.includes('carne') || text.includes('carnes') || text.includes('rôtisseur') || text.includes('rotisseur') || text.includes('asado') || text.includes('parrilla') || text.includes('brasa')) {
    return availableStations.find(s => s.toLowerCase() === 'carnes') || 'Carnes';
  }
  
  return null;
}

function extractQuantityAndUnit(text: string): { cantidad: number; unidad: string; textoRestante: string } {
  let cleanText = text;
  
  cleanText = cleanText
    .replace(/\bun\b/g, '1')
    .replace(/\buna\b/g, '1')
    .replace(/\bdos\b/g, '2')
    .replace(/\btres\b/g, '3')
    .replace(/\bcuatro\b/g, '4')
    .replace(/\bcinco\b/g, '5')
    .replace(/\bseis\b/g, '6')
    .replace(/\bsiete\b/g, '7')
    .replace(/\bocho\b/g, '8')
    .replace(/\bnueve\b/g, '9')
    .replace(/\bdiez\b/g, '10');

  const regex = /(\d+(?:[.,]\d+)?)\s*(kilos?|kg|litros?|l|gramos?|gr|g|unidades?|ud|uds|botellas?|paquetes?|manojo|piezas?|raciones|latas)/i;
  const match = cleanText.match(regex);

  if (match) {
    const rawVal = match[1].replace(',', '.');
    const rawUnit = match[2].toLowerCase();
    const cantidad = parseFloat(rawVal) || 1;
    
    let unidad = 'Kg';
    if (rawUnit.startsWith('l') && !rawUnit.startsWith('lat')) unidad = 'Litros';
    else if (rawUnit.startsWith('g')) unidad = 'Gramos';
    else if (rawUnit.startsWith('u') || rawUnit.startsWith('b') || rawUnit.startsWith('p') || rawUnit.startsWith('m') || rawUnit.startsWith('r') || rawUnit.startsWith('lat')) unidad = 'Unidades';
    else unidad = 'Kg';

    const textoRestante = cleanText.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
    return { cantidad, unidad, textoRestante };
  }

  const numOnlyMatch = cleanText.match(/\b(\d+(?:[.,]\d+)?)\b/);
  if (numOnlyMatch) {
    const rawVal = numOnlyMatch[1].replace(',', '.');
    const cantidad = parseFloat(rawVal) || 1;
    const textoRestante = cleanText.replace(numOnlyMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    return { cantidad, unidad: 'Kg', textoRestante };
  }

  return { cantidad: 1, unidad: 'Kg', textoRestante: cleanText };
}

function deduceCategory(name: string): 'Vegetales' | 'Proteinas' | 'Lacteos/Secos' {
  const n = name.toLowerCase();
  if (
    n.includes('carne') || n.includes('solomillo') || n.includes('pescado') || 
    n.includes('lubina') || n.includes('merluza') || n.includes('pollo') || 
    n.includes('ternera') || n.includes('cerdo') || n.includes('atun') || n.includes('atún')
  ) {
    return 'Proteinas';
  }
  if (
    n.includes('leche') || n.includes('nata') || n.includes('mantequilla') || 
    n.includes('harina') || n.includes('azucar') || n.includes('azúcar') || 
    n.includes('arroz') || n.includes('aceite') || n.includes('queso') || n.includes('huevo')
  ) {
    return 'Lacteos/Secos';
  }
  return 'Vegetales';
}

export function useVoiceCommander(defaultStation: StationName = 'Saucier', availableStations: string[] = []) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  const processAccumulatedText = useCallback(() => {
    const fullText = accumulatedTranscriptRef.current.trim();
    if (fullText) {
      setTranscript(fullText);
      const parsed = parseVoiceCommand(fullText, defaultStation, availableStations);
      setParsedCommand(parsed);
    }
  }, [defaultStation, availableStations]);

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // continuous = true permite que el cocinero hable con pausas sin que el micro se apague
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current += finalChunk;
          setTranscript(accumulatedTranscriptRef.current);
        }

        if (interim) {
          setInterimTranscript(interim);
        } else {
          setInterimTranscript('');
        }

        // Buffer inteligente de silencio: da 3.2 segundos de silencio antes de auto-procesar
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        silenceTimeoutRef.current = setTimeout(() => {
          processAccumulatedText();
        }, 3200);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado. Permite el acceso para usar la voz.');
        } else if (event.error === 'no-speech') {
          // No emitir error ruidoso en no-speech para dar tiempo al usuario a pensar
        } else {
          setErrorMessage(`Aviso de voz: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err: any) {
      console.error('Error inicializando SpeechRecognition', err);
      setIsSupported(false);
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [defaultStation, availableStations, processAccumulatedText]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
    setParsedCommand(null);

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    if (!recognitionRef.current) {
      setErrorMessage('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    // Procesar lo acumulado de inmediato al pulsar parar
    processAccumulatedText();
  }, [processAccumulatedText]);

  const resetCommand = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setParsedCommand(null);
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    parsedCommand,
    errorMessage,
    startListening,
    stopListening,
    resetCommand,
    setParsedCommand,
    processAccumulatedText
  };
}
