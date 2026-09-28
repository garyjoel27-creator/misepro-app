// Test script for MisePro Voice Parser & Existing Task Locator
const ACTION_VERBS = [
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
  'revisar', 'revisa', 'revisado',
  'comprobar', 'comprueba', 'comprobado',
  'rellenar', 'rellena', 'rellenado',
  'cambiar', 'cambia', 'cambiado',
  'sacar', 'saca', 'sacado',
  'guardar', 'guarda', 'guardado',
  'reponer', 'repón', 'repon', 'repuesto'
];

function deduplicateText(text) {
  if (!text) return '';
  let words = text.trim().split(/\s+/);
  if (words.length <= 1) return text.trim();

  const cleanWords = [];
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
      cleanWords.push(words[i]);
    }
  }
  words = cleanWords;

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

function stripPrefixes(text) {
  return text.trim().toLowerCase()
    .replace(/\b(urgente|prioridad urgente|prioridad crítica|prioridad critica|prioridad alta|prioridad media|prioridad baja)\b/gi, '')
    .replace(/^(oye|oiga|atento|escucha)?\s*chef\b[:,\s]*/i, '')
    .replace(/^misepro\b[:,\s]*/i, '')
    .replace(/^(por favor|hay que|toca|tienes que|tenemos que|favor de|vamos a|debes)\s+/i, '')
    .replace(/^(hace falta agregar|hace falta añadir|hace falta poner|hace falta hacer|hace falta|falta agregar|falta añadir|falta poner|falta por|falta hacer|falta)\s+/i, '')
    .replace(/^(agregar|añadir|crear tarea|crear|anotar tarea|anotar|apuntar|poner|registra|registrar|meter)\s+/i, '')
    .trim();
}

function startsWithActionVerb(text) {
  const stripped = stripPrefixes(text);
  const firstWord = stripped.split(/\s+/)[0];
  return ACTION_VERBS.includes(firstWord);
}

function containsActionVerb(text) {
  const stripped = stripPrefixes(text);
  const words = stripped.split(/\s+/);
  return words.some(w => ACTION_VERBS.includes(w));
}

function extractMetricQuantity(text) {
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

  // Convertir números escritos en palabras seguidos de unidad
  cleanText = cleanText.replace(
    /\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(kilos?|kg|litros?|l|gramos?|gr|g|unidades?|ud|uds|botellas?|paquetes?|manojos?|piezas?|raciones|latas|bandejas?)(?:\s+de)?\b/gi,
    (_match, numWord, unitWord) => {
      const numMap = {
        un: '1', una: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5',
        seis: '6', siete: '7', ocho: '8', nueve: '9', diez: '10'
      };
      return `${numMap[numWord.toLowerCase()] || numWord} ${unitWord} de `;
    }
  );

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

function detectPartida(text, availableStations = []) {
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

function deduceCategory(name) {
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

function parseVoiceCommand(
  rawInput, 
  defaultStation = 'Saucier',
  availableStations = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes']
) {
  const text = deduplicateText(rawInput);
  let clean = text.toLowerCase();
  
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

  let prioridad = 'Media';
  if (/\b(urgente|crítica|critica|alta|para ya)\b/i.test(clean)) {
    prioridad = 'Critica';
  } else if (/\b(baja|tranquilo|después|despues)\b/i.test(clean)) {
    prioridad = 'Baja';
  }
  
  // 1. Temporizador
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

  // 2. Agotado / 86 / Fuera de carta
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

  // 3. Evaluar Tarea
  const cleanWithoutPrio = clean.replace(/\b(urgente|prioridad urgente|prioridad crítica|prioridad critica|prioridad alta|prioridad media|prioridad baja)\b/gi, '').trim();
  const hasFaltaAgregar = /\b(falta|hace falta)\s+(agregar|añadir|poner|hacer)\b/i.test(cleanWithoutPrio);
  const hasFaltaAccion = /\b(falta|hace falta)\s+/i.test(cleanWithoutPrio) && containsActionVerb(cleanWithoutPrio);
  const isDirectTaskCommand = /^(agregar|añadir|crear|anotar tarea|poner)\s+/i.test(cleanWithoutPrio);
  const isExplicitAction = startsWithActionVerb(cleanWithoutPrio) || hasFaltaAccion;

  // 4. Compra / Pedido
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

  // 5. Tarea / Mise en place
  const metric = extractMetricQuantity(cleanWithoutPrio);
  const isAction = (isExplicitAction || startsWithActionVerb(cleanWithoutPrio)) && !metric.hasMetric;
  const tipoTarea = isAction ? 'accion' : 'elaboracion';

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

  // Sanear "cortar de cebolla" -> "cortar cebolla"
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

function locateExistingItem(
  query,
  targetPartida,
  kanbanTareas = [],
  comprasPendientes = [],
  agotados86 = []
) {
  if (!query || query.trim().length < 2) return null;
  
  const q = query.trim().toLowerCase();
  const strippedQ = stripPrefixes(q);
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

// SUITE DE PRUEBAS
const testCases = [
  { input: "falta agregar picar cebolla", expectedTipo: "tarea", expectedSub: "accion", expectedName: "Picar cebolla" },
  { input: "falta picar cebolla", expectedTipo: "tarea", expectedSub: "accion", expectedName: "Picar cebolla" },
  { input: "falta agregar 5 kilos de cebolla a garde manger", expectedTipo: "tarea", expectedSub: "elaboracion", expectedPartida: "Garde Manger", expectedName: "Cebolla", expectedQty: 5 },
  { input: "agregar 2 litros de salsa de vino a saucier", expectedTipo: "tarea", expectedSub: "elaboracion", expectedPartida: "Saucier", expectedQty: 2, expectedUnit: "Litros", expectedName: "Salsa de vino" },
  { input: "falta comprar 10 litros de leche", expectedTipo: "compra", expectedQty: 10, expectedUnit: "Litros", expectedCat: "Lacteos/Secos", expectedName: "Leche" },
  { input: "falta pedir solomillo", expectedTipo: "compra", expectedCat: "Proteinas", expectedName: "Solomillo" },
  { input: "falta nata", expectedTipo: "compra", expectedCat: "Lacteos/Secos", expectedName: "Nata" },
  { input: "falta limpiar merluza a pescados", expectedTipo: "tarea", expectedSub: "accion", expectedPartida: "Pescados", expectedName: "Limpiar merluza" },
  { input: "temporizador 15 minutos horno carnes", expectedTipo: "temporizador", expectedMin: 15, expectedPartida: "Carnes" },
  { input: "agotado rodaballo salvaje en pescados", expectedTipo: "agotado", expectedPartida: "Pescados", expectedName: "Rodaballo salvaje" },
  { input: "urgente falta agregar picar perejil", expectedTipo: "tarea", expectedSub: "accion", expectedPrio: "Critica", expectedName: "Picar perejil" },
  { input: "Chef, agregar deshuesar cordero para carnes", expectedTipo: "tarea", expectedSub: "accion", expectedPartida: "Carnes", expectedName: "Deshuesar cordero" },
  { input: "Oye chef, falta agregar medio kilo de mantequilla a saucier", expectedTipo: "tarea", expectedSub: "elaboracion", expectedQty: 0.5, expectedPartida: "Saucier", expectedName: "Mantequilla" },
  { input: "apuntar fuera de carta lubina", expectedTipo: "agotado", expectedName: "Lubina" },
  { input: "se acabó el vino tinto", expectedTipo: "agotado", expectedName: "Vino tinto" },
  { input: "avísame en 8 minutos solomillo", expectedTipo: "temporizador", expectedMin: 8, expectedName: "Solomillo" },
  { input: "falta 2 kilos de harina", expectedTipo: "compra", expectedQty: 2, expectedUnit: "Kg", expectedName: "Harina" },
  { input: "falta hacer salsa holandesa a saucier", expectedTipo: "tarea", expectedSub: "elaboracion", expectedPartida: "Saucier", expectedName: "Salsa holandesa" },
  { input: "hay que pelar patatas", expectedTipo: "tarea", expectedSub: "accion", expectedName: "Pelar patatas" },
  { input: "vamos a desespinar salmón en pescados", expectedTipo: "tarea", expectedSub: "accion", expectedPartida: "Pescados", expectedName: "Desespinar salmón" },
  { input: "favor de limpiar plancha", expectedTipo: "tarea", expectedSub: "accion", expectedName: "Limpiar plancha" },
  // Casos de prueba avanzados y corrección de bugs descubiertos
  { input: "falta cortar 2 kilos de cebolla", expectedTipo: "tarea", expectedSub: "elaboracion", expectedName: "Cortar cebolla", expectedQty: 2 },
  { input: "picar 3 kilos de patatas", expectedTipo: "tarea", expectedSub: "elaboracion", expectedName: "Picar patatas", expectedQty: 3 },
  { input: "limpiar 5 kilos de mejillones", expectedTipo: "tarea", expectedSub: "elaboracion", expectedName: "Limpiar mejillones", expectedQty: 5 },
  { input: "deshuesar 10 piezas de pollo a carnes", expectedTipo: "tarea", expectedSub: "elaboracion", expectedPartida: "Carnes", expectedName: "Deshuesar pollo", expectedQty: 10, expectedUnit: "Unidades" },
  { input: "revisar pescados para el servicio", expectedTipo: "tarea", expectedSub: "accion", expectedPartida: "Pescados", expectedName: "Revisar pescados para el servicio" },
  { input: "comprobar temperatura cámaras", expectedTipo: "tarea", expectedSub: "accion", expectedName: "Comprobar temperatura cámaras" },
  { input: "rellenar salsas a saucier", expectedTipo: "tarea", expectedSub: "accion", expectedPartida: "Saucier", expectedName: "Rellenar salsas" }
];

let failed = 0;
testCases.forEach((tc, idx) => {
  const res = parseVoiceCommand(tc.input);
  let ok = true;
  if (res.tipo !== tc.expectedTipo) {
    console.error(`[FAIL ${idx + 1}] tipo mismatch: got ${res.tipo}, expected ${tc.expectedTipo} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedSub && res.tipoTarea !== tc.expectedSub) {
    console.error(`[FAIL ${idx + 1}] tipoTarea mismatch: got ${res.tipoTarea}, expected ${tc.expectedSub} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedQty && res.cantidad !== tc.expectedQty) {
    console.error(`[FAIL ${idx + 1}] cantidad mismatch: got ${res.cantidad}, expected ${tc.expectedQty} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedUnit && res.unidad !== tc.expectedUnit) {
    console.error(`[FAIL ${idx + 1}] unidad mismatch: got ${res.unidad}, expected ${tc.expectedUnit} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedPartida && res.partida !== tc.expectedPartida) {
    console.error(`[FAIL ${idx + 1}] partida mismatch: got ${res.partida}, expected ${tc.expectedPartida} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedPrio && res.prioridad !== tc.expectedPrio) {
    console.error(`[FAIL ${idx + 1}] prioridad mismatch: got ${res.prioridad}, expected ${tc.expectedPrio} for "${tc.input}"`);
    ok = false;
  }
  if (tc.expectedName && res.nombre.toLowerCase() !== tc.expectedName.toLowerCase()) {
    console.error(`[FAIL ${idx + 1}] nombre mismatch: got "${res.nombre}", expected "${tc.expectedName}" for "${tc.input}"`);
    ok = false;
  }
  if (ok) {
    console.log(`[PASS ${idx + 1}] "${tc.input}" -> tipo=${res.tipo}${res.tipoTarea ? ` (${res.tipoTarea})` : ''} nombre="${res.nombre}" partida=${res.partida || '-'} prio=${res.prioridad}`);
  } else {
    failed++;
  }
});

// PRUEBAS DE LOCALIZACIÓN ("localice que ya lo tiene cuando les digo falta agregar")
console.log('\n--- VERIFICACIÓN DE LOCALIZACIÓN DE ITEMS EXISTENTES ---');

const dummyTareas = [
  { id: 't1', nombre: 'Picar cebolla', partida: 'Saucier', estado: 'Pendiente', tipo: 'accion' },
  { id: 't2', nombre: 'Fondo de ternera', partida: 'Saucier', estado: 'En Proceso', cantidad: 10, unidad: 'Litros', tipo: 'elaboracion' },
  { id: 't3', nombre: 'Cebolla brunoise', partida: 'Garde Manger', estado: 'Pendiente', cantidad: 2, unidad: 'Kg', tipo: 'elaboracion' }
];

const dummyCompras = [
  { id: 'c1', ingrediente: 'Leche entera', cantidad: 5 }
];

const dummy86 = [
  { id: '86-1', nombre: 'Lubina', partida: 'Pescados' }
];

// Test L1: Coincidencia de tarea de acción existente
const l1 = locateExistingItem('cebolla', 'Saucier', dummyTareas, dummyCompras, dummy86);
if (l1 && l1.id === 't1') {
  console.log('[PASS L1] Localizado correctamente tarea de acción "Picar cebolla" en Saucier');
} else {
  console.error('[FAIL L1] No se localizó "Picar cebolla": got', l1);
  failed++;
}

// Test L2: Coincidencia con frase "falta agregar 5 kilos de cebolla a garde manger"
const parsedL2 = parseVoiceCommand('falta agregar 5 kilos de cebolla a garde manger');
const l2 = locateExistingItem(parsedL2.nombre, parsedL2.partida, dummyTareas, dummyCompras, dummy86);
if (l2 && l2.id === 't3') {
  console.log('[PASS L2] Localizado correctamente tarea de elaboración existente "Cebolla brunoise" en Garde Manger para sumar cantidad');
} else {
  console.error('[FAIL L2] No se localizó "Cebolla brunoise": got', l2);
  failed++;
}

// Test L3: Localizar compra existente
const l3 = locateExistingItem('leche', undefined, dummyTareas, dummyCompras, dummy86);
if (l3 && l3.id === 'c1') {
  console.log('[PASS L3] Localizado ingrediente existente en lista de compras');
} else {
  console.error('[FAIL L3] No se localizó ingrediente en compras: got', l3);
  failed++;
}

// Test L4: Item inexistente retorna null
const l4 = locateExistingItem('azafrán de hebra', 'Saucier', dummyTareas, dummyCompras, dummy86);
if (l4 === null) {
  console.log('[PASS L4] Item no existente retorna null limpiamente');
} else {
  console.error('[FAIL L4] Se esperaba null para item no existente, got', l4);
  failed++;
}

if (failed === 0) {
  console.log(`\nALL ${testCases.length + 4} TESTS (PARSER + LOCATOR) PASSED PERFECTLY!`);
} else {
  console.log(`\n${failed} TESTS FAILED`);
  process.exit(1);
}
