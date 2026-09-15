import { useState, useEffect, useRef, useCallback } from 'react';
import type { StationName } from '../types/stations';

export type VoiceIntentType = 'tarea' | 'compra' | 'agotado' | 'temporizador';

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

/**
 * Elimina repeticiones de palabras consecutivas o frases duplicadas generadas por el motor de voz
 */
export function deduplicateText(text: string): string {
  if (!text) return '';
  let words = text.trim().split(/\s+/);
  if (words.length <= 1) return text.trim();

  // 1. Eliminar palabras consecutivas idénticas ("cebolla cebolla" -> "cebolla")
  const cleanWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
      cleanWords.push(words[i]);
    }
  }
  words = cleanWords;

  // 2. Eliminar frases duplicadas consecutivas de longitud k (ej: "cortar cebolla cortar cebolla")
  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    passes++;
    changed = false;
    const maxK = Math.floor(words.length / 2);
    for (let k = maxK; k >= 2; k--) {
      for (let i = 0; i <= words.length - 2 * k; i++) {
        const slice1 = words.slice(i, i + k).map(w => w.toLowerCase()).join(' ');
        const slice2 = words.slice(i + k, i + 2 * k).map(w => w.toLowerCase()).join(' ');
        if (slice1 === slice2) {
          words.splice(i + k, k);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return words.join(' ');
}

/**
 * Une los resultados emitidos por Web Speech API resolviendo el bug de acumulación de Chrome en Android,
 * los solapamientos de palabras y las emisiones idénticas repetidas.
 */
export function mergeTranscriptResults(results: string[]): string {
  if (!results || results.length === 0) return '';
  let merged = '';

  for (const raw of results) {
    const text = (raw || '').trim();
    if (!text) continue;

    if (!merged) {
      merged = text;
      continue;
    }

    const mergedLower = merged.toLowerCase();
    const textLower = text.toLowerCase();

    // 1. Emisiones idénticas emitidas por Chrome Android
    if (mergedLower === textLower) continue;

    // 2. Modo acumulativo de Android: la nueva emisión contiene todo lo anterior y algo más
    if (textLower.startsWith(mergedLower)) {
      merged = text;
      continue;
    }

    // 3. Si la nueva emisión ya está contenida al final de lo acumulado
    if (mergedLower.endsWith(textLower)) continue;

    // 4. Comprobación de solapamiento de palabras en la costura
    const mergedWords = merged.split(/\s+/);
    const textWords = text.split(/\s+/);
    let maxOverlap = 0;

    const maxCheck = Math.min(mergedWords.length, textWords.length);
    for (let k = maxCheck; k >= 1; k--) {
      const endSlice = mergedWords.slice(mergedWords.length - k).map(w => w.toLowerCase()).join(' ');
      const startSlice = textWords.slice(0, k).map(w => w.toLowerCase()).join(' ');
      if (endSlice === startSlice) {
        maxOverlap = k;
        break;
      }
    }

    if (maxOverlap > 0) {
      const newPart = textWords.slice(maxOverlap).join(' ');
      if (newPart) {
        merged = merged + ' ' + newPart;
      }
    } else {
      merged = merged + ' ' + text;
    }
  }

  return deduplicateText(merged.trim());
}

/**
 * Extrae únicamente las palabras nuevas de la transcripción provisional (interim)
 * que aún no han sido integradas en la transcripción definitiva (final).
 */
export function extractInterimDelta(finalText: string, interimText: string): string {
  if (!interimText) return '';
  const f = finalText.trim().toLowerCase();
  const i = interimText.trim().toLowerCase();

  if (!f) return interimText.trim();
  if (f === i || f.endsWith(i)) return '';
  if (i.startsWith(f)) {
    return interimText.trim().slice(finalText.trim().length).trim();
  }

  const fWords = f.split(/\s+/);
  const iWords = i.split(/\s+/);
  let overlap = 0;
  for (let k = Math.min(fWords.length, iWords.length); k >= 1; k--) {
    if (fWords.slice(-k).join(' ') === iWords.slice(0, k).join(' ')) {
      overlap = k;
      break;
    }
  }

  if (overlap > 0) {
    return interimText.trim().split(/\s+/).slice(overlap).join(' ');
  }

  return interimText.trim();
}

export function parseVoiceCommand(
  rawInput: string, 
  defaultStation: StationName = 'Saucier',
  availableStations: string[] = []
): ParsedVoiceCommand {
  const text = deduplicateText(rawInput);
  const clean = text.toLowerCase();
  
  if (!clean || clean.length < 2) {
    return {
      tipo: 'tarea',
      rawText: text,
      nombre: '',
      cantidad: 1,
      unidad: 'Kg',
      partida: availableStations[0] || defaultStation,
      prioridad: 'Media',
      confianza: 0.1
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
      
    nombre = deduplicateText(nombre);
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
      .replace(/^el /gi, '')
      .replace(/^la /gi, '')
      .replace(/^los /gi, '')
      .replace(/^las /gi, '')
      .trim();

    nombre = deduplicateText(nombre);
    if (!nombre) nombre = 'Plato Agotado';
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    return {
      tipo: 'agotado',
      rawText: text,
      nombre,
      partida: detectPartida(clean, availableStations) || defaultStation,
      motivo: 'Agotado durante el servicio (Voz)',
      confianza: 0.92
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

    nombre = deduplicateText(nombre);
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
      confianza: 0.9
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

  if (partida) {
    const regPartida = new RegExp(`(a |en )?${partida}`, 'gi');
    nombre = nombre.replace(regPartida, '');
  }

  nombre = deduplicateText(nombre.trim());
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
    confianza: clean.length > 3 ? 0.94 : 0.6
  };
}

function detectPartida(text: string, availableStations: string[] = []): StationName | null {
  for (const st of availableStations) {
    if (text.includes(st.toLowerCase())) {
      return st;
    }
  }

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
    n.includes('carne') || n.includes('pescado') || n.includes('pollo') || 
    n.includes('solomillo') || n.includes('ternera') || n.includes('cerdo') || 
    n.includes('atun') || n.includes('atún') || n.includes('merluza') || 
    n.includes('gambas') || n.includes('marisco') || n.includes('pulpo') ||
    n.includes('pato') || n.includes('lomo')
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const finalResults: string[] = [];
        const interimResults: string[] = [];

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = (res[0]?.transcript || '').trim();
          if (!text) continue;

          if (res.isFinal) {
            finalResults.push(text);
          } else {
            interimResults.push(text);
          }
        }

        const cleanFinal = mergeTranscriptResults(finalResults);
        const rawInterim = mergeTranscriptResults(interimResults);
        const cleanInterim = extractInterimDelta(cleanFinal, rawInterim);

        setTranscript(cleanFinal);
        setInterimTranscript(cleanInterim);

        const currentCombined = cleanInterim 
          ? deduplicateText((cleanFinal + ' ' + cleanInterim).trim()) 
          : cleanFinal;
        
        // Interpretar en vivo si hay al menos 2 caracteres
        if (currentCombined.length >= 2) {
          const liveParsed = parseVoiceCommand(currentCombined, defaultStation, availableStations);
          setParsedCommand(liveParsed);
        }

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Buffer de silencio: tras 2.2s sin nuevas palabras, consolidar
        silenceTimeoutRef.current = setTimeout(() => {
          if (cleanFinal || cleanInterim) {
            const finalFull = cleanInterim 
              ? deduplicateText((cleanFinal + ' ' + cleanInterim).trim()) 
              : cleanFinal;
            if (finalFull) {
              setTranscript(finalFull);
              setInterimTranscript('');
              const parsed = parseVoiceCommand(finalFull, defaultStation, availableStations);
              setParsedCommand(parsed);
            }
          }
        }, 2200);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado. Permite el acceso en los ajustes de tu navegador.');
        } else if (event.error === 'no-speech') {
          // Ignorar no-speech para no interrumpir al usuario mientras piensa
        } else {
          setErrorMessage(`Aviso de micrófono: ${event.error}`);
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
  }, [defaultStation, availableStations]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedCommand(null);

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    if (!recognitionRef.current) {
      setErrorMessage('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    try {
      // Abortar cualquier sesión anterior para vaciar el buffer acumulado de Chrome
      recognitionRef.current.abort();
    } catch (_) {}

    setTimeout(() => {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start retry', err);
      }
    }, 60);
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const resetCommand = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    setParsedCommand(null);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const forceParseNow = useCallback(() => {
    const full = deduplicateText((transcript + ' ' + interimTranscript).trim());
    if (full) {
      setTranscript(full);
      setInterimTranscript('');
      const parsed = parseVoiceCommand(full, defaultStation, availableStations);
      setParsedCommand(parsed);
    }
  }, [transcript, interimTranscript, defaultStation, availableStations]);

  const applyCustomText = useCallback((customText: string) => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    const clean = deduplicateText(customText.trim());
    setTranscript(clean);
    setInterimTranscript('');
    const parsed = parseVoiceCommand(clean, defaultStation, availableStations);
    setParsedCommand(parsed);
  }, [defaultStation, availableStations]);

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
    forceParseNow,
    applyCustomText
  };
}
