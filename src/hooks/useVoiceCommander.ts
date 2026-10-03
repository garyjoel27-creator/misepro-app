import { useState, useEffect, useRef, useCallback } from 'react';
import type { StationName } from '../types/stations';

export type VoiceIntentType = 'tarea' | 'compra' | 'agotado' | 'temporizador';

export interface ParsedVoiceCommand {
  tipo: VoiceIntentType;
  tipoTarea?: 'accion' | 'elaboracion';
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

export interface LocatedExistingItem {
  type: 'tarea' | 'compra' | 'agotado';
  id: string;
  nombre: string;
  partida?: string;
  estado?: string;
  cantidad?: number;
  unidad?: string;
  tipoTarea?: 'accion' | 'elaboracion';
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

export const ACTION_VERBS = [
  'cortar', 'corta', 'cortado',
  'picar', 'pica', 'picado',
  'limpiar', 'limpia', 'limpiado',
  'descongelar', 'descongela', 'descongelado',
  'repasar', 'repasa', 'repasado',
  'montar', 'monta', 'montado',
  'pelar', 'pela', 'pelado',
  'deshuesar', 'deshuesa', 'deshuesado',
  'organizar', 'organiza', 'organizado',
  'marcar', 'marca', 'marcado',
  'rallar', 'ralla', 'rallado',
  'laminar', 'lamina', 'laminado',
  'tornear', 'tornea', 'torneado',
  'pochar', 'pocha', 'pochado',
  'sofreir', 'sofrie', 'sofrito',
  'filetear', 'filetea', 'fileteado',
  'porcionar', 'porciona', 'porcionado',
  'envasar', 'envasa', 'envasado',
  'rotular', 'rotula', 'rotulado',
  'ordenar', 'ordena', 'ordenado',
  'desalar', 'desala', 'desalado',
  'hidratar', 'hidrata', 'hidratado',
  'marinar', 'marina', 'marinado',
  'blanquear', 'blanquea', 'blanqueado',
  'desespinar', 'desespina', 'desespinado',
  'cocer', 'cuece', 'cocido',
  'hervir', 'hierve', 'hervido',
  'asar', 'asa', 'asado',
  'hornear', 'hornea', 'horneado',
  'freir', 'freír', 'frie', 'frito',
  'reducir', 'reduce', 'reducido',
  'colar', 'cuela', 'colado',
  'filtrar', 'filtra', 'filtrado',
  'emulsionar', 'emulsiona', 'emulsionado',
  'batir', 'bate', 'batido',
  'triturar', 'tritura', 'triturado',
  'pesar', 'pesa', 'pesado',
  'etiquetar', 'etiqueta', 'etiquetado',
  'fechar', 'fecha', 'fechado',
  'temperar', 'atemperar', 'atempera', 'atemperado',
  'enfriar', 'enfria', 'enfriado',
  'abatir', 'abate', 'abatido',
  'desmigar', 'desmiga', 'desmigado',
  'racionar', 'raciona', 'racionado',
  'preparar', 'prepara', 'preparado',
  'hacer', 'haz', 'hecho',
  // Verbos de acción adicionales en brigada
  'revisar', 'revisa', 'revisado',
  'comprobar', 'comprueba', 'comprobado',
  'rellenar', 'rellena', 'rellenado',
  'cambiar', 'cambia', 'cambiado',
  'sacar', 'saca', 'sacado',
  'guardar', 'guarda', 'guardado',
  'reponer', 'repón', 'repon', 'repuesto'
];

export function stripPrefixes(text: string): string {
  return text.trim().toLowerCase()
    .replace(/\b(urgente|prioridad urgente|prioridad crítica|prioridad critica|prioridad alta|prioridad media|prioridad baja)\b/gi, '')
    .replace(/^(oye|oiga|atento|escucha)?\s*chef\b[:,\s]*/i, '')
    .replace(/^misepro\b[:,\s]*/i, '')
    .replace(/^(por favor|hay que|toca|tienes que|tenemos que|favor de|vamos a|debes)\s+/i, '')
    .replace(/^(hace falta agregar|hace falta añadir|hace falta poner|hace falta hacer|hace falta|falta agregar|falta añadir|falta poner|falta por|falta hacer|falta)\s+/i, '')
    .replace(/^(agregar|añadir|crear tarea|crear|anotar tarea|anotar|apuntar|poner|registra|registrar|meter)\s+/i, '')
    .trim();
}

export function startsWithActionVerb(text: string): boolean {
  const stripped = stripPrefixes(text);
  const firstWord = stripped.split(/\s+/)[0];
  return ACTION_VERBS.includes(firstWord);
}

export function containsActionVerb(text: string): boolean {
  const stripped = stripPrefixes(text);
  const words = stripped.split(/\s+/);
  return words.some(w => ACTION_VERBS.includes(w));
}

export function extractMetricQuantity(text: string): { 
  hasMetric: boolean; 
  cantidad?: number; 
  unidad?: string; 
  textoRestante: string;
} {
  let cleanText = text;

  // Fracciones en español
  cleanText = cleanText.replace(/\bmedio\s+kilo(?:\s+de)?\b/gi, '0.5 kg de ');
  cleanText = cleanText.replace(/\bkilo\s+y\s+medio(?:\s+de)?\b/gi, '1.5 kg de ');
  cleanText = cleanText.replace(/\b(\d+)\s+kilos?\s+y\s+medio(?:\s+de)?\b/gi, (_m, n) => `${parseFloat(n) + 0.5} kg de `);
  cleanText = cleanText.replace(/\bdos\s+kilos\s+y\s+medio(?:\s+de)?\b/gi, '2.5 kg de ');
  cleanText = cleanText.replace(/\btres\s+kilos\s+y\s+medio(?:\s+de)?\b/gi, '3.5 kg de ');
  cleanText = cleanText.replace(/\bcuatro\s+kilos\s+y\s+medio(?:\s+de)?\b/gi, '4.5 kg de ');
  cleanText = cleanText.replace(/\bcinco\s+kilos\s+y\s+medio(?:\s+de)?\b/gi, '5.5 kg de ');
  cleanText = cleanText.replace(/\bmedia\s+docena(?:\s+de)?\b/gi, '6 unidades de ');
  cleanText = cleanText.replace(/\buna\s+docena(?:\s+de)?\b/gi, '12 unidades de ');

  // Convertir palabras numéricas seguidas de unidad culinaria
  cleanText = cleanText.replace(
    /\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(kilos?|kg|litros?|l|gramos?|gr|g|unidades?|ud|uds|botellas?|paquetes?|manojos?|piezas?|raciones|latas|bandejas?)(?:\s+de)?\b/gi,
    (_match, numWord, unitWord) => {
      const numMap: Record<string, string> = {
        un: '1', una: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5',
        seis: '6', siete: '7', ocho: '8', nueve: '9', diez: '10'
      };
      return `${numMap[numWord.toLowerCase()] || numWord} ${unitWord} de `;
    }
  );

  // Consumir opcionalmente "de" después de la unidad para evitar "cortar de cebolla"
  const regexWithUnit = /(\d+(?:[.,]\d+)?)\s*(kilos?|kg|litros?|l|gramos?|gr|g|unidades?|ud|uds|botellas?|paquetes?|manojo|piezas?|raciones|latas|bandejas?)(?:\s+de\b)?/i;
  const match = cleanText.match(regexWithUnit);

  if (match) {
    const rawVal = match[1].replace(',', '.');
    const rawUnit = match[2].toLowerCase();
    const cantidad = parseFloat(rawVal) || 1;
    
    let unidad = 'Kg';
    if (rawUnit.startsWith('l') && !rawUnit.startsWith('lat')) unidad = 'Litros';
    else if (rawUnit.startsWith('g')) unidad = 'Gramos';
    else if (rawUnit.startsWith('u') || rawUnit.startsWith('b') || rawUnit.startsWith('p') || rawUnit.startsWith('m') || rawUnit.startsWith('r') || rawUnit.startsWith('lat')) unidad = 'Unidades';
    else unidad = 'Kg';

    let textoRestante = cleanText.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
    // Limpiar preposición suelta "de" al inicio o tras verbo de acción
    textoRestante = textoRestante.replace(/^de\s+/i, '');
    return { hasMetric: true, cantidad, unidad, textoRestante };
  }

  // Comprobar si hay un número aislado
  const numOnlyMatch = cleanText.match(/\b(\d+(?:[.,]\d+)?)(?:\s+de\b)?/);
  if (numOnlyMatch) {
    const rawVal = numOnlyMatch[1].replace(',', '.');
    const cantidad = parseFloat(rawVal) || 1;
    let textoRestante = cleanText.replace(numOnlyMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    textoRestante = textoRestante.replace(/^de\s+/i, '');
    return { hasMetric: true, cantidad, unidad: 'Kg', textoRestante };
  }

  return { hasMetric: false, textoRestante: cleanText };
}

function detectPartida(text: string, availableStations: string[] = []): StationName | null {
  for (const st of availableStations) {
    const reg = new RegExp(`\\b${st}\\b`, 'i');
    if (reg.test(text)) {
      return st;
    }
  }

  if (/\b(saucier|salsa|salsas|fondo|fondos|caldo|caldos)\b/i.test(text)) {
    return availableStations.find(s => s.toLowerCase() === 'saucier') || 'Saucier';
  }
  if (/\b(garde manger|cuarto frío|cuarto frio|ensalada|ensaladas|vegetal|vegetales)\b/i.test(text)) {
    return availableStations.find(s => s.toLowerCase() === 'garde manger') || 'Garde Manger';
  }
  if (/\b(pescado|pescados|poissonier|marisco|mariscos|mar)\b/i.test(text)) {
    return availableStations.find(s => s.toLowerCase() === 'pescados') || 'Pescados';
  }
  if (/\b(carne|carnes|rôtisseur|rotisseur|asado|asados|parrilla|brasa)\b/i.test(text)) {
    return availableStations.find(s => s.toLowerCase() === 'carnes') || 'Carnes';
  }
  
  return null;
}

function deduceCategory(name: string): 'Vegetales' | 'Proteinas' | 'Lacteos/Secos' {
  const n = name.toLowerCase();
  if (
    n.includes('carne') || n.includes('pescado') || n.includes('pollo') || 
    n.includes('solomillo') || n.includes('ternera') || n.includes('cerdo') || 
    n.includes('atun') || n.includes('atún') || n.includes('merluza') || 
    n.includes('gambas') || n.includes('marisco') || n.includes('pulpo') ||
    n.includes('pato') || n.includes('lomo') || n.includes('cordero')
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

export function parseVoiceCommand(
  rawInput: string, 
  defaultStation: StationName = 'Saucier',
  availableStations: string[] = []
): ParsedVoiceCommand {
  const text = deduplicateText(rawInput);
  let clean = text.toLowerCase();
  
  // Limpiar invocación de wake words al inicio si vienen concatenados
  clean = clean.replace(/^(oye|oiga|atento|escucha)?\s*chef\b[:,\s]*/i, '').replace(/^misepro\b[:,\s]*/i, '').trim();

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

  // Detectar prioridad
  let prioridad: 'Critica' | 'Media' | 'Baja' = 'Media';
  if (/\b(urgente|crítica|critica|alta|para ya)\b/i.test(clean)) {
    prioridad = 'Critica';
  } else if (/\b(baja|tranquilo|después|despues)\b/i.test(clean)) {
    prioridad = 'Baja';
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
    const partidaDetectada = detectPartida(clean, availableStations) || defaultStation;
    let nombre = clean
      .replace(/^(apuntar|anotar|marcar|poner)\s+/gi, '')
      .replace(/marcar agotado/gi, '')
      .replace(/marcar fuera de carta/gi, '')
      .replace(/fuera de carta/gi, '')
      .replace(/agotado/gi, '')
      .replace(/se acab[oó]/gi, '')
      .replace(/no queda/gi, '')
      .replace(new RegExp(`\\b(en|a|para)?\\s*${partidaDetectada}\\b`, 'gi'), '')
      .trim()
      .replace(/^(el|la|los|las)\s+/gi, '')
      .trim();

    nombre = deduplicateText(nombre);
    if (!nombre) nombre = 'Plato Agotado';
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    return {
      tipo: 'agotado',
      rawText: text,
      nombre,
      partida: partidaDetectada,
      motivo: 'Agotado durante el servicio (Voz)',
      confianza: 0.92
    };
  }

  // 3. Evaluar si es una TAREA (Mise en Place) con "falta agregar...", "falta [verbo]" o verbos de acción
  const cleanWithoutPrio = clean.replace(/\b(urgente|prioridad urgente|prioridad crítica|prioridad critica|prioridad alta|prioridad media|prioridad baja)\b/gi, '').trim();
  const hasFaltaAgregar = /\b(falta|hace falta)\s+(agregar|añadir|poner|hacer)\b/i.test(cleanWithoutPrio);
  const hasFaltaAccion = /\b(falta|hace falta)\s+/i.test(cleanWithoutPrio) && containsActionVerb(cleanWithoutPrio);
  const isDirectTaskCommand = /^(agregar|añadir|crear|anotar tarea|poner)\s+/i.test(cleanWithoutPrio);
  const isExplicitAction = startsWithActionVerb(cleanWithoutPrio) || hasFaltaAccion;

  // 4. Detectar Intención: COMPRA / PEDIDO
  const isExplicitCompra = (
    clean.includes('comprar') || 
    clean.includes('compra') || 
    clean.includes('pedir') || 
    clean.includes('pedido') ||
    clean.includes('anotar compra') ||
    clean.includes('apuntar compra') ||
    (clean.includes('falta') && !hasFaltaAgregar && !hasFaltaAccion && !isDirectTaskCommand)
  );

  if (isExplicitCompra) {
    const { cantidad, unidad, textoRestante } = extractMetricQuantity(cleanWithoutPrio);
    
    let nombre = textoRestante
      .replace(/anotar compra/gi, '')
      .replace(/apuntar compra/gi, '')
      .replace(/comprar/gi, '')
      .replace(/compra/gi, '')
      .replace(/pedir/gi, '')
      .replace(/pedido/gi, '')
      .replace(/falta/gi, '')
      .trim()
      .replace(/^de\s+/gi, '')
      .replace(/^(un|una|el|la|los|las)\s+/gi, '')
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

  // 5. Intención por Defecto: TAREA / MISE EN PLACE
  const metric = extractMetricQuantity(cleanWithoutPrio);
  const isAction = (isExplicitAction || startsWithActionVerb(cleanWithoutPrio)) && !metric.hasMetric;
  const tipoTarea: 'accion' | 'elaboracion' = isAction ? 'accion' : 'elaboracion';

  const textoBase = isAction ? cleanWithoutPrio : (metric.hasMetric ? metric.textoRestante : cleanWithoutPrio);
  const partida = detectPartida(clean, availableStations) || defaultStation;
  
  let nombre = stripPrefixes(textoBase)
    .replace(/a la partida de/gi, '')
    .replace(/en la partida de/gi, '')
    .replace(/a la partida/gi, '')
    .replace(/en la partida/gi, '')
    .replace(/^de\s+/gi, '');

  if (partida) {
    const regPartida = new RegExp(`\\b(a|en|para)\\s+(?:la partida de\\s*)?${partida}\\b|\\b(?:la partida de\\s*)${partida}\\b`, 'gi');
    nombre = nombre.replace(regPartida, '');
  }

  // Sanear "cortar de cebolla" -> "cortar cebolla" para verbos de acción
  const verbDeRegex = new RegExp(`^(${ACTION_VERBS.join('|')})\\s+de\\s+`, 'i');
  nombre = nombre.replace(verbDeRegex, '$1 ');

  nombre = deduplicateText(nombre.trim());
  if (!nombre) nombre = cleanWithoutPrio;
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

  return {
    tipo: 'tarea',
    tipoTarea,
    rawText: text,
    nombre,
    cantidad: isAction ? undefined : (metric.cantidad || 1),
    unidad: isAction ? undefined : (metric.unidad || 'Kg'),
    partida,
    prioridad,
    confianza: clean.length > 3 ? 0.94 : 0.6
  };
}

/**
 * Localiza si un ingrediente, acción o preparación ya existe en el tablero Kanban o en compras
 */
export function locateExistingItem(
  query: string,
  targetPartida: string | undefined,
  kanbanTareas: { id: string; nombre: string; partida: string; estado: string; cantidad?: number; unidad?: string; tipo?: 'accion' | 'elaboracion' }[] = [],
  comprasPendientes: { id: string; ingrediente: string; cantidad: number }[] = [],
  agotados86: { id: string; nombre: string; partida: string }[] = []
): LocatedExistingItem | null {
  if (!query || query.trim().length < 2) return null;
  
  const q = query.trim().toLowerCase();
  const strippedQ = stripPrefixes(q);
  // Extraer palabras clave eliminando verbos de acción
  const wordsQ = strippedQ.split(/\s+/).filter(w => !ACTION_VERBS.includes(w) && w.length > 2);
  const coreNoun = wordsQ.join(' ') || strippedQ;

  // 1. Kanban Tareas
  const matchingTasks = kanbanTareas.filter(t => {
    const tName = t.nombre.toLowerCase();
    const tStripped = stripPrefixes(tName);
    const tWords = tStripped.split(/\s+/).filter(w => !ACTION_VERBS.includes(w) && w.length > 2);
    const tCore = tWords.join(' ') || tStripped;

    if (tName === q || tStripped === strippedQ || tCore === coreNoun) return true;
    if (coreNoun.length >= 3 && (tName.includes(coreNoun) || coreNoun.includes(tName) || tCore.includes(coreNoun) || coreNoun.includes(tCore))) return true;
    return false;
  });

  if (matchingTasks.length > 0) {
    const best = (targetPartida ? matchingTasks.find(t => t.partida.toLowerCase() === targetPartida.toLowerCase() && t.estado !== 'Completado') : null)
      || matchingTasks.find(t => t.estado !== 'Completado')
      || matchingTasks[0];

    return {
      type: 'tarea',
      id: best.id,
      nombre: best.nombre,
      partida: best.partida,
      estado: best.estado,
      cantidad: best.cantidad,
      unidad: best.unidad,
      tipoTarea: best.tipo
    };
  }

  // 2. Compras
  const matchingCompra = comprasPendientes.find(c => {
    const cName = c.ingrediente.toLowerCase();
    return cName === q || cName === coreNoun || (coreNoun.length >= 3 && (cName.includes(coreNoun) || coreNoun.includes(cName)));
  });

  if (matchingCompra) {
    return {
      type: 'compra',
      id: matchingCompra.id,
      nombre: matchingCompra.ingrediente,
      cantidad: matchingCompra.cantidad,
      unidad: 'Kg'
    };
  }

  // 3. Agotados 86
  const matching86 = agotados86.find(a => {
    const aName = a.nombre.toLowerCase();
    return aName === q || aName === coreNoun || (coreNoun.length >= 3 && (aName.includes(coreNoun) || coreNoun.includes(aName)));
  });

  if (matching86) {
    return {
      type: 'agotado',
      id: matching86.id,
      nombre: matching86.nombre,
      partida: matching86.partida
    };
  }

  return null;
}

import { audioService } from '../utils/audioSingleton';

/**
 * Generadores de Chimes Culinarios por Web Audio API (Offline, Zero Dependencias, Singleton)
 */
export function playWakeChime() {
  audioService.playWakeChime();
}

export function playSuccessChime() {
  audioService.playSuccessChime();
}

export function playCancelChime() {
  audioService.playCancelChime();
}

export function playAlertChime() {
  audioService.playAlertChime();
}

const WAKE_WORDS = [
  'oye chef',
  'oiga chef',
  'hola chef',
  'hey chef',
  'ey chef',
  'dime chef',
  'atento chef',
  'escucha chef',
  'chef',
  'cheff',
  'chefe',
  'oye che',
  'oiga che',
  'oye jefe',
  'oiga jefe',
  'jefe de cocina',
  'jefe',
  'misepro',
  'mise pro',
  'oye cocina',
  'atenta cocina'
];

export function checkWakeWord(text: string): { isWake: boolean; remainderText: string } {
  if (!text) return { isWake: false, remainderText: '' };
  const clean = text.toLowerCase().trim().replace(/^[¿?¡!.,;:]+/, '').trim();
  
  for (const w of WAKE_WORDS) {
    const regex = new RegExp(`^${w}\\b[:\\s,]*`, 'i');
    if (regex.test(clean)) {
      const remainder = clean.replace(regex, '').trim();
      return { isWake: true, remainderText: remainder };
    }
    // Si contiene el wake word en cualquier parte de la frase
    const idx = clean.indexOf(w);
    if (idx !== -1) {
      const remainder = clean.slice(idx + w.length).replace(/^[:\s,]+/, '').trim();
      return { isWake: true, remainderText: remainder };
    }
  }
  return { isWake: false, remainderText: '' };
}

export interface VoiceActionHandlers {
  onConfirm?: () => void;
  onCancel?: () => void;
  onToggleTipo?: () => void;
  onSumExisting?: () => void;
}

export interface UseVoiceCommanderOptions {
  isModalOpen?: boolean;
  onWakeDetected?: (parsed: ParsedVoiceCommand | null, rawRemainder: string) => void;
  onVoiceConfirm?: () => void;
  onVoiceCancel?: () => void;
  onVoiceToggleTipo?: () => void;
  onVoiceSumExisting?: () => void;
}

/**
 * Permiso de micrófono: Web Speech API gestiona su propio permiso nativo en el navegador.
 * No se debe anteponer getUserMedia({audio:true}) porque rompe el gesto de usuario (User Activation)
 * en iOS Safari y Android Chrome e interrumpe el subsistema de audio.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  return true;
}

export function useVoiceCommander(
  defaultStation: StationName = 'Saucier', 
  availableStations: string[] = [],
  options?: UseVoiceCommanderOptions
) {
  const [isListening, setIsListening] = useState(false);
  const [isAmbientListening, setIsAmbientListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition
    );
  });
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manos Libres (Wake Word Engine)
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('misepro_wake_word_enabled');
      if (saved !== null) return saved === 'true';
      return false; // Por defecto apagado: 100% foco en pulsación manual inmediata
    } catch {
      return false;
    }
  });

  const isModalOpen = options?.isModalOpen ?? false;
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;

  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  wakeWordEnabledRef.current = wakeWordEnabled;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const defaultStationRef = useRef(defaultStation);
  defaultStationRef.current = defaultStation;

  const availableStationsRef = useRef(availableStations);
  availableStationsRef.current = availableStations;

  const dynamicActionsRef = useRef<VoiceActionHandlers>({});
  const userPausedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  // Instancia activa de SpeechRecognition y timers
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);

  const registerVoiceActions = useCallback((handlers: VoiceActionHandlers) => {
    dynamicActionsRef.current = handlers;
  }, []);

  // Función para arrancar reconocimiento en modo ambiental (Wake Word: "Oye Chef")
  const startAmbientListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!wakeWordEnabledRef.current || userPausedRef.current || isModalOpenRef.current) return;

    const SpeechRec = 
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsAmbientListening(true);
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = (event.results[i][0]?.transcript || '').trim();
          if (!text) continue;

          const check = checkWakeWord(text);
          if (check.isWake) {
            playWakeChime();

            let parsed: ParsedVoiceCommand | null = null;
            if (check.remainderText && check.remainderText.length >= 2) {
              parsed = parseVoiceCommand(
                check.remainderText, 
                defaultStationRef.current, 
                availableStationsRef.current
              );
            }

            setTranscript(check.remainderText ? deduplicateText(check.remainderText) : '');
            setInterimTranscript('');
            setParsedCommand(parsed);
            setIsListening(true);
            setIsAmbientListening(false);

            optionsRef.current?.onWakeDetected?.(parsed, check.remainderText);
            return;
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Si el navegador bloquea escucha en segundo plano sin interacción directa, apagar ambiental sin molestar
          setIsAmbientListening(false);
        }
      };

      recognition.onend = () => {
        if (wakeWordEnabledRef.current && !userPausedRef.current && !isModalOpenRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (wakeWordEnabledRef.current && !userPausedRef.current && !isModalOpenRef.current) {
              startAmbientListening();
            }
          }, 350);
        } else {
          setIsAmbientListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsAmbientListening(false);
    }
  }, []);

  // Función núcleo para iniciar la sesión de captura manual activa
  const startListeningInstance = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = 
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMessage('Reconocimiento no disponible en este navegador. Usa Chrome o Safari.');
      return;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // Detener de forma limpia cualquier instancia anterior
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setErrorMessage(null);
        setIsListening(true);
        setIsAmbientListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          let phrase = (res[0]?.transcript || '').trim();
          if (!phrase) continue;

          // Limpiar wake word inicial si el usuario comenzó diciendo "Oye Chef"
          const check = checkWakeWord(phrase);
          if (check.isWake && check.remainderText) {
            phrase = check.remainderText;
          }

          if (!phrase) continue;

          if (res.isFinal) {
            final += (final ? ' ' : '') + phrase;
          } else {
            interim += (interim ? ' ' : '') + phrase;
          }
        }

        const cleanFinal = deduplicateText(final);
        const cleanInterim = deduplicateText(interim);

        if (cleanInterim) {
          setInterimTranscript(cleanInterim);
        } else {
          setInterimTranscript('');
        }

        if (cleanFinal) {
          setTranscript(cleanFinal);
          setInterimTranscript('');

          // Atajos de control por voz (cuando la frase completa es el comando)
          const lowerFinal = cleanFinal.toLowerCase().trim();
          if (/^(confirmar|guardar|listo|inyectar|oído|oido|vale|dale)$/i.test(lowerFinal)) {
            if (dynamicActionsRef.current.onConfirm) {
              dynamicActionsRef.current.onConfirm();
            } else {
              optionsRef.current?.onVoiceConfirm?.();
            }
            return;
          }
          if (/^(sumar|suma|añadir cantidad|sumar cantidad)$/i.test(lowerFinal)) {
            if (dynamicActionsRef.current.onSumExisting) {
              dynamicActionsRef.current.onSumExisting();
              return;
            }
          }
          if (/^(cancelar|cerrar|atrás|atras|salir)$/i.test(lowerFinal)) {
            if (dynamicActionsRef.current.onCancel) {
              dynamicActionsRef.current.onCancel();
            } else {
              optionsRef.current?.onVoiceCancel?.();
            }
            return;
          }
          if (/^(acción|accion|operativa|cambiar a acción|cambiar a accion)$/i.test(lowerFinal)) {
            if (dynamicActionsRef.current.onToggleTipo) {
              dynamicActionsRef.current.onToggleTipo();
            } else {
              optionsRef.current?.onVoiceToggleTipo?.();
            }
            return;
          }

          // Clasificación semántica íntegra del comando
          const parsed = parseVoiceCommand(cleanFinal, defaultStationRef.current, availableStationsRef.current);
          setParsedCommand(parsed);
        } else if (cleanInterim && cleanInterim.length >= 2) {
          const parsed = parseVoiceCommand(cleanInterim, defaultStationRef.current, availableStationsRef.current);
          setParsedCommand(parsed);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Permiso de micrófono no concedido. Permite el acceso al micrófono en los ajustes de tu navegador.');
          setIsListening(false);
          setIsAmbientListening(false);
        } else if (event.error === 'no-speech') {
          // Silencio acústico normal en cocina, no es un error
        } else if (event.error === 'aborted') {
          // Detención intencional
        } else {
          console.warn('SpeechRecognition warning:', event.error);
        }
      };

      recognition.onend = () => {
        // En navegadores móviles (iOS Safari / Android Chrome), la API detiene la escucha tras unos segundos de silencio.
        // Si el modal continúa abierto y el usuario no pulsó pausa, reiniciamos suavemente.
        if (isModalOpenRef.current && !userPausedRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (isModalOpenRef.current && !userPausedRef.current) {
              try {
                startListeningInstance();
              } catch {
                setIsListening(false);
              }
            }
          }, 150);
        } else if (wakeWordEnabledRef.current && !userPausedRef.current && !isModalOpenRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (wakeWordEnabledRef.current && !userPausedRef.current && !isModalOpenRef.current) {
              startAmbientListening();
            }
          }, 300);
        } else {
          setIsListening(false);
          setIsAmbientListening(false);
        }
      };

      // Invocación síncrona dentro del User Gesture
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('Error al iniciar SpeechRecognition:', err);
      if (err?.name === 'InvalidStateError') {
        // Si la instancia previa aún no terminó de cerrarse, reintentar a los 100ms
        setTimeout(() => {
          if (isModalOpenRef.current && !userPausedRef.current) {
            try {
              startListeningInstance();
            } catch {}
          }
        }, 100);
      } else {
        setErrorMessage('No se pudo activar el micrófono. Toca de nuevo para reintentar.');
        setIsListening(false);
      }
    }
  }, [startAmbientListening]);

  // Listener para registrar primera interacción del usuario para wake word
  useEffect(() => {
    const onInteraction = () => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        if (wakeWordEnabledRef.current && !userPausedRef.current && !isModalOpenRef.current && !recognitionRef.current) {
          startAmbientListening();
        }
      }
    };

    window.addEventListener('click', onInteraction, { passive: true });
    window.addEventListener('touchstart', onInteraction, { passive: true });
    window.addEventListener('keydown', onInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('keydown', onInteraction);
    };
  }, [startAmbientListening]);

  // Sincronización de apertura/cierre de modal
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;

    if (!isModalOpen) {
      setTranscript('');
      setInterimTranscript('');
      setParsedCommand(null);

      if (wakeWordEnabled && !userPausedRef.current && hasUserInteractedRef.current) {
        startAmbientListening();
      } else {
        if (!wakeWordEnabled) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
          }
          setIsListening(false);
          setIsAmbientListening(false);
        }
      }
    } else {
      userPausedRef.current = false;
      hasUserInteractedRef.current = true;
    }
  }, [isModalOpen, wakeWordEnabled, startAmbientListening]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleWakeWord = useCallback(() => {
    hasUserInteractedRef.current = true;
    setWakeWordEnabled(prev => {
      const next = !prev;
      wakeWordEnabledRef.current = next;
      try {
        localStorage.setItem('misepro_wake_word_enabled', String(next));
      } catch {}

      if (next) {
        playWakeChime();
        userPausedRef.current = false;
        if (!isModalOpenRef.current) {
          startAmbientListening();
        }
      } else {
        playCancelChime();
        userPausedRef.current = true;
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        if (recognitionRef.current && !isModalOpenRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }
        setIsAmbientListening(false);
        setIsListening(false);
      }
      return next;
    });
  }, [startAmbientListening]);

  // startListening: Completamente SÍNCRONO en el gesto del usuario
  const startListening = useCallback(() => {
    userPausedRef.current = false;
    hasUserInteractedRef.current = true;
    setErrorMessage(null);
    setTranscript('');
    setInterimTranscript('');
    setParsedCommand(null);

    // Feedback háptico instantáneo
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(35); } catch {}
    }

    startListeningInstance();
  }, [startListeningInstance]);

  const stopListening = useCallback(() => {
    userPausedRef.current = true;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsAmbientListening(false);
  }, []);

  const resetCommand = useCallback(() => {
    setParsedCommand(null);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const forceParseNow = useCallback(() => {
    const full = deduplicateText((transcript + ' ' + interimTranscript).trim());
    if (full) {
      setTranscript(full);
      setInterimTranscript('');
      const parsed = parseVoiceCommand(full, defaultStationRef.current, availableStationsRef.current);
      setParsedCommand(parsed);
    }
  }, [transcript, interimTranscript]);

  const applyCustomText = useCallback((customText: string) => {
    const clean = deduplicateText(customText.trim());
    setTranscript(clean);
    setInterimTranscript('');
    const parsed = parseVoiceCommand(clean, defaultStationRef.current, availableStationsRef.current);
    setParsedCommand(parsed);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    parsedCommand,
    errorMessage,
    wakeWordEnabled,
    isAmbientListening,
    toggleWakeWord,
    startListening,
    stopListening,
    resetCommand,
    setParsedCommand,
    forceParseNow,
    applyCustomText,
    registerVoiceActions
  };
}

export type VoiceCommanderController = ReturnType<typeof useVoiceCommander>;
