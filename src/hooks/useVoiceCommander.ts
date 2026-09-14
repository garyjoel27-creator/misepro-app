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

// Interfaz para Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function parseVoiceCommand(text: string, defaultStation: StationName = 'Saucier'): ParsedVoiceCommand {
  const clean = text.trim().toLowerCase();
  
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
    // Extraer minutos
    const minMatch = clean.match(/(\d+)\s*(minutos?|min|m)/i) || clean.match(/(\d+)/);
    const minutos = minMatch ? parseInt(minMatch[1], 10) : 5;
    
    // Extraer nombre/descripción del temporizador
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
    // Capitalizar
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    return {
      tipo: 'temporizador',
      rawText: text,
      nombre,
      minutos,
      partida: detectPartida(clean) || defaultStation,
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
      partida: detectPartida(clean) || defaultStation,
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

    // Deducir categoría
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
  // "agregar 4 kilos de solomillo a carnes", "cortar 3 cebollas en garde manger", "hacer 5 litros de fondo en saucier"
  const { cantidad, unidad, textoRestante } = extractQuantityAndUnit(clean);
  const partida = detectPartida(clean) || defaultStation;
  
  // Limpiar texto para obtener el nombre de la tarea
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
    .replace(/a carnes/gi, '')
    .replace(/a pescados/gi, '')
    .replace(/a saucier/gi, '')
    .replace(/a garde manger/gi, '')
    .replace(/en carnes/gi, '')
    .replace(/en pescados/gi, '')
    .replace(/en saucier/gi, '')
    .replace(/en garde manger/gi, '')
    .replace(/prioridad urgente/gi, '')
    .replace(/prioridad crítica/gi, '')
    .replace(/prioridad critica/gi, '')
    .replace(/prioridad media/gi, '')
    .replace(/prioridad baja/gi, '')
    .replace(/urgente/gi, '')
    .replace(/^de /gi, '')
    .trim();

  if (!nombre) nombre = clean;
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

  // Detectar prioridad
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

function detectPartida(text: string): StationName | null {
  if (text.includes('saucier') || text.includes('salsa') || text.includes('fondo') || text.includes('caldo')) {
    return 'Saucier';
  }
  if (text.includes('garde manger') || text.includes('cuarto frío') || text.includes('cuarto frio') || text.includes('ensalada') || text.includes('vegetal')) {
    return 'Garde Manger';
  }
  if (text.includes('pescado') || text.includes('poissonier') || text.includes('marisco') || text.includes('mar') || text.includes('pescados')) {
    return 'Pescados';
  }
  if (text.includes('carne') || text.includes('carnes') || text.includes('rôtisseur') || text.includes('rotisseur') || text.includes('asado')) {
    return 'Carnes';
  }
  return null;
}

function extractQuantityAndUnit(text: string): { cantidad: number; unidad: string; textoRestante: string } {
  // Ejemplos: "5 kilos", "10 litros", "3 kg", "500 gramos", "2 botes", "4 unidades", "un kilo", "dos litros"
  let cleanText = text;
  
  // Reemplazar números en palabras básicos en español
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

  // Buscar patrón: número + unidad
  const regex = /(\d+(?:[.,]\d+)?)\s*(kilos?|kg|litros?|l|gramos?|gr|g|unidades?|ud|uds|botellas?|paquetes?|manojo|piezas?)/i;
  const match = cleanText.match(regex);

  if (match) {
    const rawVal = match[1].replace(',', '.');
    const rawUnit = match[2].toLowerCase();
    const cantidad = parseFloat(rawVal) || 1;
    
    let unidad = 'Kg';
    if (rawUnit.startsWith('l')) unidad = 'Litros';
    else if (rawUnit.startsWith('g')) unidad = 'Gramos';
    else if (rawUnit.startsWith('u') || rawUnit.startsWith('b') || rawUnit.startsWith('p') || rawUnit.startsWith('m')) unidad = 'Unidades';
    else unidad = 'Kg';

    const textoRestante = cleanText.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
    return { cantidad, unidad, textoRestante };
  }

  // Buscar solo número sin unidad
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

export function useVoiceCommander(defaultStation: StationName = 'Saucier') {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Chequear disponibilidad de Web Speech API (Safari iOS = webkitSpeechRecognition, Chrome/Android = SpeechRecognition/webkitSpeechRecognition)
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Parar al terminar de hablar para procesar de inmediato
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // Castellano nativo de cocina

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setTranscript(final);
          const parsed = parseVoiceCommand(final, defaultStation);
          setParsedCommand(parsed);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado. Permite el acceso para usar la voz.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No se detectó audio. Habla cerca del micrófono del dispositivo.');
        } else {
          setErrorMessage(`Error de reconocimiento: ${event.error}`);
        }
        setIsListening(false);
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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [defaultStation]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedCommand(null);

    if (!recognitionRef.current) {
      setErrorMessage('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Si ya estaba escuchando, reiniciamos
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const resetCommand = useCallback(() => {
    setParsedCommand(null);
    setTranscript('');
    setInterimTranscript('');
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
    setParsedCommand
  };
}
