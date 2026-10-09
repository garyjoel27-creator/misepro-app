import { create } from 'zustand';
import { get, set } from 'idb-keyval';

export interface TurnoData {
  nombreServicio: string;
  comensales: number;
  horaPase?: string;
}

export interface Tarea {
  id: string;
  nombre: string;
  cantidad?: number;
  unidad?: string;
  tipo?: 'accion' | 'elaboracion';
  prioridad: 'Critica' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'En Proceso' | 'Completado';
  partida: string;
  fechaCaducidad?: string;
}

export interface ProcesoHabitual {
  id: string;
  nombre: string;
  partida: string;
  cantidadSugerida: number;
  unidad: string;
  prioridad: 'Critica' | 'Media' | 'Baja';
}

export interface Compra {
  id: string;
  ingrediente: string;
  cantidad: number;
  categoria: 'Vegetales' | 'Proteinas' | 'Lacteos/Secos' | 'Otros';
}

export interface Temporizador {
  id: string;
  nombre: string;
  partida: string;
  duracionSegundos: number;
  finTimestamp: number; // Timestamp absoluto en ms para resiliencia ante recargas
  estado: 'activo' | 'pausado' | 'terminado';
  segundosRestantesPausado?: number;
  alarmaSilenciada?: boolean;
}

export interface Item86 {
  id: string;
  nombre: string;
  partida: string;
  hora: string;
  motivo?: string;
}

export interface NotaPostIt {
  id: string;
  texto: string;
  timestamp: number;
}

export interface PuntoControlAPPCC {
  id: string;
  nombre: string;
  tipo: 'camara' | 'congelador' | 'aceite' | 'lavavajillas' | 'otro';
  tempMinLegal: number;
  tempMaxLegal: number;
  tempIdeal: number;
  unidad: string;
}

export interface MedicionAPPCC {
  puntoId: string;
  nombrePunto: string;
  valor: number;
  conforme: boolean;
  accionCorrectora?: string;
}

export interface RegistroAPPCC {
  id: string;
  timestamp: number;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  turno: 'Mañana' | 'Tarde';
  responsable: string;
  mediciones: MedicionAPPCC[];
  incidenciaDetectada: boolean;
}

export interface DatosEstablecimientoAPPCC {
  nombre: string;
  cif: string;
  responsable: string;
}

export interface BrigadeState {
  turnoActual: TurnoData;
  nombreRestaurante: string;
  hasConfiguredOnboarding: boolean;
  partidas: string[];
  coloresPartidas: Record<string, string>;
  kanbanTareas: Tarea[];
  comprasPendientes: Compra[];
  
  // Modo Servicio & Herramientas en Pase
  modoServicio: boolean;
  temporizadores: Temporizador[];
  agotados86: Item86[];
  
  // Escalamiento Operativo V2
  pinJefe: string | null;
  isChefMode: boolean;
  notasPostIt: NotaPostIt[];
  modoZen: boolean;
  
  toggleModoServicio: () => void;
  crearTemporizador: (nombre: string, partida: string, minutos: number) => void;
  ajustarTiempoTemporizador: (id: string, deltaSegundos: number) => void;
  pausarTemporizador: (id: string) => void;
  reanudarTemporizador: (id: string) => void;
  reiniciarTemporizador: (id: string) => void;
  eliminarTemporizador: (id: string) => void;
  silenciarAlarmaTemporizador: (id: string) => void;
  marcarAgotado86: (nombre: string, partida: string, motivo?: string) => void;
  quitarAgotado86: (id: string) => void;
  vaciarAgotados86: () => void;

  setTurnoActual: (turno: TurnoData) => void;
  setNombreRestaurante: (nombre: string) => void;
  finalizarOnboarding: (nombreRestaurante: string, partidas: string[], plantilla?: boolean) => void;
  reiniciarOnboarding: () => void;
  resetearTurno: (nuevoServicio?: string, pax?: number) => void;
  agregarPartida: (nombre: string, colorKey?: string) => void;
  renombrarPartida: (nombreAntiguo: string, nombreNuevo: string) => void;
  setColorPartida: (partida: string, colorKey: string) => void;
  eliminarPartida: (nombre: string) => void;
  vaciarTodasLasPartidas: () => void;
  cargarPlantillaClasica: () => void;
  exportarConfiguracionJSON: () => string;
  importarConfiguracionJSON: (jsonStr: string) => { success: boolean; error?: string };
  agregarTarea: (tarea: Tarea) => void;
  actualizarTarea: (id: string, cambios: Partial<Tarea>) => void;
  eliminarTarea: (id: string) => void;
  moverTarea: (id: string, nuevoEstado: Tarea['estado']) => void;
  agregarCompra: (compra: Compra) => void;
  cargarDatos: () => Promise<void>;
  vaciarCompras: () => void;

  // Acciones V2
  toggleChefMode: (pin?: string) => boolean;
  setPinJefe: (pin: string | null) => void;
  toggleModoZen: () => void;
  agregarNotaPostIt: (texto: string) => void;
  editarNotaPostIt: (id: string, nuevoTexto: string) => void;
  eliminarNotaPostIt: (id: string) => void;
  cerrarTurno: () => void;

  // Catálogo de Procesos Habituales & Control de Limpieza
  procesosHabituales: ProcesoHabitual[];
  guardarProcesoHabitual: (proceso: Omit<ProcesoHabitual, 'id'>) => void;
  eliminarProcesoHabitual: (id: string) => void;
  limpiarCompletadas: (partida: string) => void;

  // Sistema Blindado APPCC / Sanidad
  puntosControlAPPCC: PuntoControlAPPCC[];
  registrosAPPCC: RegistroAPPCC[];
  datosEstablecimientoAPPCC: DatosEstablecimientoAPPCC;
  registrarLecturaAPPCC: (registro: Omit<RegistroAPPCC, 'id' | 'timestamp'>) => void;
  actualizarPuntosControlAPPCC: (puntos: PuntoControlAPPCC[]) => void;
  actualizarDatosEstablecimientoAPPCC: (datos: Partial<DatosEstablecimientoAPPCC>) => void;
  eliminarRegistroAPPCC: (id: string) => void;
}

export const PUNTOS_CONTROL_APPCC_DEFECTO: PuntoControlAPPCC[] = [
  { id: 'appcc-c1', nombre: 'Cámara Carnes y Aves', tipo: 'camara', tempMinLegal: 0, tempMaxLegal: 3, tempIdeal: 2, unidad: 'ºC' },
  { id: 'appcc-c2', nombre: 'Cámara Pescados y Mariscos', tipo: 'camara', tempMinLegal: 0, tempMaxLegal: 2, tempIdeal: 1, unidad: 'ºC' },
  { id: 'appcc-c3', nombre: 'Cámara Frutas y Verduras', tipo: 'camara', tempMinLegal: 2, tempMaxLegal: 6, tempIdeal: 4, unidad: 'ºC' },
  { id: 'appcc-c4', nombre: 'Cámara Lácteos y Elaborados', tipo: 'camara', tempMinLegal: 0, tempMaxLegal: 4, tempIdeal: 3, unidad: 'ºC' },
  { id: 'appcc-c5', nombre: 'Congelador General', tipo: 'congelador', tempMinLegal: -25, tempMaxLegal: -18, tempIdeal: -20, unidad: 'ºC' },
  { id: 'appcc-c6', nombre: 'Freidora Aceite Fritura', tipo: 'aceite', tempMinLegal: 140, tempMaxLegal: 180, tempIdeal: 170, unidad: 'ºC' },
  { id: 'appcc-c7', nombre: 'Lavavajillas Aclarado Térmico', tipo: 'lavavajillas', tempMinLegal: 80, tempMaxLegal: 90, tempIdeal: 85, unidad: 'ºC' },
];

export const PROCESOS_HABITUALES_INICIALES: ProcesoHabitual[] = [
  // Saucier
  { id: 'proc-s1', nombre: 'Fondo Oscuro de Ternera', partida: 'Saucier', cantidadSugerida: 10, unidad: 'Litros', prioridad: 'Critica' },
  { id: 'proc-s2', nombre: 'Reducción Vino Tinto y Chalotas', partida: 'Saucier', cantidadSugerida: 2, unidad: 'Litros', prioridad: 'Media' },
  { id: 'proc-s3', nombre: 'Salsa Demi-Glace', partida: 'Saucier', cantidadSugerida: 3, unidad: 'Litros', prioridad: 'Critica' },
  { id: 'proc-s4', nombre: 'Mantequilla Clarificada (Ghee)', partida: 'Saucier', cantidadSugerida: 1.5, unidad: 'Kg', prioridad: 'Baja' },
  
  // Garde Manger
  { id: 'proc-gm1', nombre: 'Brunoise Fina de Chalota/Cebolla', partida: 'Garde Manger', cantidadSugerida: 1.5, unidad: 'Kg', prioridad: 'Media' },
  { id: 'proc-gm2', nombre: 'Vinagreta Emulsionada de Jerez', partida: 'Garde Manger', cantidadSugerida: 1.5, unidad: 'Litros', prioridad: 'Baja' },
  { id: 'proc-gm3', nombre: 'Selección de Brotes y Microgreens', partida: 'Garde Manger', cantidadSugerida: 0.5, unidad: 'Kg', prioridad: 'Media' },
  { id: 'proc-gm4', nombre: 'Base Tártar Aliñada al Momento', partida: 'Garde Manger', cantidadSugerida: 1, unidad: 'Kg', prioridad: 'Critica' },

  // Carnes
  { id: 'proc-c1', nombre: 'Porcionado Solomillos (200g)', partida: 'Carnes', cantidadSugerida: 6, unidad: 'Kg', prioridad: 'Critica' },
  { id: 'proc-c2', nombre: 'Marcado y Atemperado Chuleteros', partida: 'Carnes', cantidadSugerida: 8, unidad: 'Kg', prioridad: 'Media' },
  { id: 'proc-c3', nombre: 'Glaseado Carrilleras Ibéricas', partida: 'Carnes', cantidadSugerida: 4, unidad: 'Kg', prioridad: 'Media' },
  { id: 'proc-c4', nombre: 'Deshuesado y Braseado Cordero', partida: 'Carnes', cantidadSugerida: 5, unidad: 'Kg', prioridad: 'Critica' },

  // Pescados
  { id: 'proc-p1', nombre: 'Eviscerado y Fileteado Lubinas', partida: 'Pescados', cantidadSugerida: 6, unidad: 'Kg', prioridad: 'Critica' },
  { id: 'proc-p2', nombre: 'Desespinado Fino y Raciones Salmón', partida: 'Pescados', cantidadSugerida: 5, unidad: 'Kg', prioridad: 'Critica' },
  { id: 'proc-p3', nombre: 'Limpieza Calamar de Potera', partida: 'Pescados', cantidadSugerida: 3, unidad: 'Kg', prioridad: 'Media' },
  { id: 'proc-p4', nombre: 'Fumet Blanco de Roca y Mariscos', partida: 'Pescados', cantidadSugerida: 8, unidad: 'Litros', prioridad: 'Critica' },
];

const getInitialOnboardingState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('misepro_has_onboarding');
    if (val !== null) return val === 'true';
    if (localStorage.getItem('misepro_restaurant_name') || localStorage.getItem('misepro_partidas')) {
      return true;
    }
  } catch {}
  return false;
};

const getInitialRestaurantName = (): string => {
  if (typeof window === 'undefined') return 'Mi Cocina Pro';
  try {
    const val = localStorage.getItem('misepro_restaurant_name');
    if (val && val.trim()) return val.trim();
  } catch {}
  return 'Mi Cocina Pro';
};

const getInitialPartidas = (): string[] => {
  if (typeof window === 'undefined') return ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];
  try {
    const val = localStorage.getItem('misepro_partidas');
    if (val) {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];
};

const getInitialColoresPartidas = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const val = localStorage.getItem('misepro_colores_partidas');
    if (val) {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch {}
  return {};
};

const syncCoreToLocalStorage = (data: {
  hasConfiguredOnboarding?: boolean;
  nombreRestaurante?: string;
  partidas?: string[];
  coloresPartidas?: Record<string, string>;
}) => {
  if (typeof window === 'undefined') return;
  try {
    if (data.hasConfiguredOnboarding !== undefined) {
      localStorage.setItem('misepro_has_onboarding', String(data.hasConfiguredOnboarding));
    }
    if (data.nombreRestaurante !== undefined) {
      localStorage.setItem('misepro_restaurant_name', data.nombreRestaurante);
    }
    if (data.partidas !== undefined) {
      localStorage.setItem('misepro_partidas', JSON.stringify(data.partidas));
    }
    if (data.coloresPartidas !== undefined) {
      localStorage.setItem('misepro_colores_partidas', JSON.stringify(data.coloresPartidas));
    }
  } catch {}
};

export const useBrigadeStore = create<BrigadeState>((setStore, getStore) => ({
  turnoActual: {
    nombreServicio: 'Cena',
    comensales: 120,
    horaPase: '20:30',
  },
  nombreRestaurante: getInitialRestaurantName(),
  hasConfiguredOnboarding: getInitialOnboardingState(),
  partidas: getInitialPartidas(),
  coloresPartidas: getInitialColoresPartidas(),
  procesosHabituales: PROCESOS_HABITUALES_INICIALES,
  kanbanTareas: [
    { id: '1', nombre: 'Fondo Oscuro', cantidad: 10, unidad: 'Litros', tipo: 'elaboracion', prioridad: 'Critica', estado: 'Pendiente', partida: 'Saucier' },
    { id: '2', nombre: 'Beurre Blanc', cantidad: 2, unidad: 'Litros', tipo: 'elaboracion', prioridad: 'Media', estado: 'En Proceso', partida: 'Saucier' },
    { id: '3', nombre: 'Cortar verduras para ensalada', tipo: 'accion', prioridad: 'Baja', estado: 'Completado', partida: 'Garde Manger' },
    { id: '4', nombre: 'Despiece Solomillo', cantidad: 8, unidad: 'Kg', tipo: 'elaboracion', prioridad: 'Critica', estado: 'Pendiente', partida: 'Carnes' },
    { id: '5', nombre: 'Limpieza Merluza', tipo: 'accion', prioridad: 'Media', estado: 'Pendiente', partida: 'Pescados' }
  ],
  comprasPendientes: [],
  modoServicio: false,
  temporizadores: [
    {
      id: 't-1',
      nombre: 'Solomillo Wellington (Horno)',
      partida: 'Carnes',
      duracionSegundos: 720,
      finTimestamp: Date.now() + 720 * 1000,
      estado: 'activo'
    },
    {
      id: 't-2',
      nombre: 'Hogazas Pan Masa Madre',
      partida: 'Garde Manger',
      duracionSegundos: 480,
      finTimestamp: Date.now() + 480 * 1000,
      estado: 'activo'
    }
  ],
  agotados86: [
    {
      id: '86-1',
      nombre: 'Rodaballo Salvaje',
      partida: 'Pescados',
      hora: '21:15',
      motivo: 'Fin de existencias lonja'
    }
  ],
  
  // Estado V2
  pinJefe: '1234',
  isChefMode: false,
  notasPostIt: [],
  modoZen: false,
  puntosControlAPPCC: PUNTOS_CONTROL_APPCC_DEFECTO,
  registrosAPPCC: [],
  datosEstablecimientoAPPCC: {
    nombre: 'Restaurante GastroPro',
    cif: 'B-12345678',
    responsable: 'Jefe de Cocina'
  },

  toggleModoServicio: () => {
    setStore((state) => {
      const newState = { modoServicio: !state.modoServicio };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  crearTemporizador: (nombre, partida, minutos) => {
    setStore((state) => {
      const duracionSegundos = minutos * 60;
      const nuevo: Temporizador = {
        id: crypto.randomUUID(),
        nombre,
        partida,
        duracionSegundos,
        finTimestamp: Date.now() + duracionSegundos * 1000,
        estado: 'activo'
      };
      const newState = { temporizadores: [nuevo, ...state.temporizadores] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  ajustarTiempoTemporizador: (id, deltaSegundos) => {
    setStore((state) => {
      const newState = {
        temporizadores: state.temporizadores.map((t): Temporizador => {
          if (t.id !== id) return t;
          if (t.estado === 'pausado') {
            const restante = Math.max(0, (t.segundosRestantesPausado || 0) + deltaSegundos);
            return { 
              ...t, 
              segundosRestantesPausado: restante, 
              alarmaSilenciada: false,
              estado: (restante > 0 ? 'pausado' : 'terminado') as Temporizador['estado']
            };
          }
          const nuevoFin = t.finTimestamp + deltaSegundos * 1000;
          return { 
            ...t, 
            finTimestamp: nuevoFin, 
            alarmaSilenciada: false,
            estado: (nuevoFin > Date.now() ? 'activo' : 'terminado') as Temporizador['estado']
          };
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  pausarTemporizador: (id) => {
    setStore((state) => {
      const newState = {
        temporizadores: state.temporizadores.map((t): Temporizador => {
          if (t.id !== id || t.estado !== 'activo') return t;
          const restante = Math.max(0, Math.floor((t.finTimestamp - Date.now()) / 1000));
          return { 
            ...t, 
            estado: 'pausado' as const, 
            segundosRestantesPausado: restante 
          };
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  reanudarTemporizador: (id) => {
    setStore((state) => {
      const newState = {
        temporizadores: state.temporizadores.map((t): Temporizador => {
          if (t.id !== id || t.estado !== 'pausado') return t;
          const restante = t.segundosRestantesPausado || 0;
          return {
            ...t,
            estado: 'activo' as const,
            finTimestamp: Date.now() + restante * 1000,
            segundosRestantesPausado: undefined
          };
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  reiniciarTemporizador: (id) => {
    setStore((state) => {
      const newState = {
        temporizadores: state.temporizadores.map((t): Temporizador => {
          if (t.id !== id) return t;
          return {
            ...t,
            estado: 'activo' as const,
            finTimestamp: Date.now() + t.duracionSegundos * 1000,
            segundosRestantesPausado: undefined
          };
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarTemporizador: (id) => {
    setStore((state) => {
      const newState = { temporizadores: state.temporizadores.filter((t) => t.id !== id) };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  silenciarAlarmaTemporizador: (id) => {
    setStore((state) => {
      const newState = {
        temporizadores: state.temporizadores.map((t): Temporizador => {
          if (t.id !== id) return t;
          return { ...t, alarmaSilenciada: true };
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  marcarAgotado86: (nombre, partida, motivo) => {
    setStore((state) => {
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nuevo86: Item86 = {
        id: crypto.randomUUID(),
        nombre,
        partida,
        hora: horaActual,
        motivo
      };
      const newState = { agotados86: [nuevo86, ...state.agotados86] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  quitarAgotado86: (id) => {
    setStore((state) => {
      const newState = { agotados86: state.agotados86.filter((item) => item.id !== id) };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },
  
  vaciarAgotados86: () => {
    setStore((state) => {
      const newState = { agotados86: [] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  setTurnoActual: (turno) => {
    setStore({ turnoActual: turno });
    set('brigade-sync-store', getStore());
  },
  
  resetearTurno: (nuevoServicio = 'Almuerzo', pax = 50) => {
    setStore({
      turnoActual: { nombreServicio: nuevoServicio, comensales: pax, horaPase: '13:30' },
      kanbanTareas: [],
      comprasPendientes: [],
      agotados86: [],
      notasPostIt: []
    });
    set('brigade-sync-store', getStore());
  },

  setNombreRestaurante: (nombre) => {
    setStore((state) => {
      const clean = nombre.trim() || 'Mi Cocina Pro';
      const newState = { 
        nombreRestaurante: clean,
        hasConfiguredOnboarding: true 
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        nombreRestaurante: clean
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  finalizarOnboarding: (nombreRestaurante, partidasElegidas, plantilla = false) => {
    setStore((state) => {
      let finalPartidas = partidasElegidas;
      if (plantilla || finalPartidas.length === 0) {
        finalPartidas = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];
      }
      const cleanName = nombreRestaurante.trim() || 'Mi Cocina Pro';
      const newState = {
        nombreRestaurante: cleanName,
        hasConfiguredOnboarding: true,
        partidas: finalPartidas,
        // Si eligió plantilla, mantenemos las tareas de demo, si eligió limpio, vaciamos tareas
        kanbanTareas: plantilla ? state.kanbanTareas : []
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        nombreRestaurante: cleanName,
        partidas: finalPartidas
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  reiniciarOnboarding: () => {
    setStore((state) => {
      const newState = { hasConfiguredOnboarding: false };
      syncCoreToLocalStorage({ hasConfiguredOnboarding: false });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  agregarPartida: (nombre, colorKey) => {
    setStore((state) => {
      const clean = nombre.trim();
      if (!clean || state.partidas.includes(clean)) return state;
      const newColores = { ...state.coloresPartidas };
      if (colorKey) {
        newColores[clean] = colorKey;
      }
      const newPartidas = [...state.partidas, clean];
      const newState = { 
        partidas: newPartidas,
        coloresPartidas: newColores,
        hasConfiguredOnboarding: true
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        partidas: newPartidas,
        coloresPartidas: newColores
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  renombrarPartida: (nombreAntiguo, nombreNuevo) => {
    setStore((state) => {
      const cleanNuevo = nombreNuevo.trim();
      if (!cleanNuevo || state.partidas.includes(cleanNuevo)) return state;
      
      const newPartidas = state.partidas.map(p => p === nombreAntiguo ? cleanNuevo : p);
      const newTareas = state.kanbanTareas.map(t => t.partida === nombreAntiguo ? { ...t, partida: cleanNuevo } : t);
      const newColores = { ...state.coloresPartidas };
      if (newColores[nombreAntiguo]) {
        newColores[cleanNuevo] = newColores[nombreAntiguo];
        delete newColores[nombreAntiguo];
      }

      const newState = {
        partidas: newPartidas,
        kanbanTareas: newTareas,
        coloresPartidas: newColores,
        hasConfiguredOnboarding: true
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        partidas: newPartidas,
        coloresPartidas: newColores
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  setColorPartida: (partida, colorKey) => {
    setStore((state) => {
      const newColores = { ...state.coloresPartidas, [partida]: colorKey };
      const newState = { 
        coloresPartidas: newColores,
        hasConfiguredOnboarding: true 
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        coloresPartidas: newColores
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarPartida: (nombre) => {
    setStore((state) => {
      const newColores = { ...state.coloresPartidas };
      delete newColores[nombre];
      const newPartidas = state.partidas.filter(p => p !== nombre);
      const newState = { 
        partidas: newPartidas,
        kanbanTareas: state.kanbanTareas.filter(t => t.partida !== nombre),
        coloresPartidas: newColores,
        hasConfiguredOnboarding: true
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        partidas: newPartidas,
        coloresPartidas: newColores
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  vaciarTodasLasPartidas: () => {
    setStore((state) => {
      const newState = {
        partidas: [],
        kanbanTareas: [],
        coloresPartidas: {},
        hasConfiguredOnboarding: true
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        partidas: [],
        coloresPartidas: {}
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  cargarPlantillaClasica: () => {
    setStore((state) => {
      const clasicas = ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'];
      const colores = {
        Saucier: 'amber',
        'Garde Manger': 'emerald',
        Pescados: 'sky',
        Carnes: 'red'
      };
      const newState = {
        partidas: clasicas,
        coloresPartidas: colores,
        hasConfiguredOnboarding: true
      };
      syncCoreToLocalStorage({
        hasConfiguredOnboarding: true,
        partidas: clasicas,
        coloresPartidas: colores
      });
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  exportarConfiguracionJSON: () => {
    const state = getStore();
    const backup = {
      version: '1.0',
      nombreRestaurante: state.nombreRestaurante,
      partidas: state.partidas,
      coloresPartidas: state.coloresPartidas,
      procesosHabituales: state.procesosHabituales,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  importarConfiguracionJSON: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || !Array.isArray(data.partidas)) {
        return { success: false, error: 'Formato inválido: falta la lista de partidas.' };
      }
      setStore((state) => {
        const newState = {
          nombreRestaurante: data.nombreRestaurante || state.nombreRestaurante,
          partidas: data.partidas,
          coloresPartidas: data.coloresPartidas || {},
          procesosHabituales: Array.isArray(data.procesosHabituales) ? data.procesosHabituales : state.procesosHabituales,
          hasConfiguredOnboarding: true
        };
        syncCoreToLocalStorage({
          hasConfiguredOnboarding: true,
          nombreRestaurante: newState.nombreRestaurante,
          partidas: newState.partidas,
          coloresPartidas: newState.coloresPartidas
        });
        set('brigade-sync-store', { ...state, ...newState });
        return newState;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'El archivo no contiene un JSON válido.' };
    }
  },

  agregarTarea: (tarea) => {
    setStore((state) => {
      const newState = { kanbanTareas: [...state.kanbanTareas, tarea] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  actualizarTarea: (id, cambios) => {
    setStore((state) => {
      const newState = {
        kanbanTareas: state.kanbanTareas.map(t => t.id === id ? { ...t, ...cambios } : t)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarTarea: (id) => {
    setStore((state) => {
      const newState = {
        kanbanTareas: state.kanbanTareas.filter(t => t.id !== id)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  moverTarea: (id, nuevoEstado) => {
    setStore((state) => {
      const newState = {
        kanbanTareas: state.kanbanTareas.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  agregarCompra: (compra) => {
    setStore((state) => {
      const newState = { comprasPendientes: [...state.comprasPendientes, compra] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  vaciarCompras: () => {
    setStore((state) => {
      const newState = { comprasPendientes: [] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  cargarDatos: async () => {
    try {
      const data = await get('brigade-sync-store');
      if (data) {
        const localConfigured = typeof window !== 'undefined' && localStorage.getItem('misepro_has_onboarding') === 'true';
        const hasOnboarding = localConfigured || data.hasConfiguredOnboarding === true || (Array.isArray(data.partidas) && data.partidas.length > 0);
        const mergedData = {
           ...data,
           turnoActual: data.turnoActual ?? getStore().turnoActual,
           nombreRestaurante: data.nombreRestaurante || 'Mi Cocina Pro',
           hasConfiguredOnboarding: hasOnboarding,
           coloresPartidas: data.coloresPartidas ?? {},
           // Si ya configuró su onboarding o tiene partidas guardadas, se respeta estrictamente lo guardado
           partidas: Array.isArray(data.partidas) 
             ? data.partidas 
             : (hasOnboarding ? [] : getStore().partidas),
           kanbanTareas: Array.isArray(data.kanbanTareas) 
             ? data.kanbanTareas 
             : (hasOnboarding ? [] : getStore().kanbanTareas),
           comprasPendientes: Array.isArray(data.comprasPendientes) ? data.comprasPendientes : [],
           temporizadores: data.temporizadores ?? getStore().temporizadores,
           agotados86: data.agotados86 ?? getStore().agotados86,
           modoServicio: data.modoServicio ?? false,
           isChefMode: data.isChefMode ?? false,
           pinJefe: data.pinJefe !== undefined ? data.pinJefe : '1234',
           notasPostIt: data.notasPostIt ?? [],
           modoZen: data.modoZen ?? false,
           procesosHabituales: data.procesosHabituales?.length > 0 ? data.procesosHabituales : getStore().procesosHabituales,
           puntosControlAPPCC: data.puntosControlAPPCC?.length > 0 ? data.puntosControlAPPCC : PUNTOS_CONTROL_APPCC_DEFECTO,
           registrosAPPCC: Array.isArray(data.registrosAPPCC) ? data.registrosAPPCC : [],
           datosEstablecimientoAPPCC: data.datosEstablecimientoAPPCC ?? getStore().datosEstablecimientoAPPCC
        };
        syncCoreToLocalStorage({
          hasConfiguredOnboarding: hasOnboarding,
          nombreRestaurante: mergedData.nombreRestaurante,
          partidas: mergedData.partidas,
          coloresPartidas: mergedData.coloresPartidas
        });
        setStore(mergedData);
      }
    } catch (e) {
      console.error('Error loading data from IndexedDB', e);
    }
  },
  
  // Implementación V2
  toggleChefMode: (pin?: string) => {
    let success = false;
    setStore((state) => {
      if (state.isChefMode) {
        const newState = { isChefMode: false };
        set('brigade-sync-store', { ...state, ...newState });
        success = true;
        return newState;
      } else {
        if (!state.pinJefe || state.pinJefe === pin) {
          const newState = { isChefMode: true };
          set('brigade-sync-store', { ...state, ...newState });
          success = true;
          return newState;
        }
        return state;
      }
    });
    return success;
  },

  setPinJefe: (pin: string | null) => {
    setStore((state) => {
      const newState = { pinJefe: pin };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  toggleModoZen: () => {
    setStore((state) => {
      const newState = { modoZen: !state.modoZen };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  agregarNotaPostIt: (texto: string) => {
    setStore((state) => {
      const nuevaNota: NotaPostIt = {
        id: crypto.randomUUID(),
        texto,
        timestamp: Date.now()
      };
      const newState = { notasPostIt: [nuevaNota, ...state.notasPostIt] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarNotaPostIt: (id: string) => {
    setStore((state) => {
      const newState = { notasPostIt: state.notasPostIt.filter(n => n.id !== id) };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  editarNotaPostIt: (id: string, nuevoTexto: string) => {
    setStore((state) => {
      const newState = {
        notasPostIt: state.notasPostIt.map(n => n.id === id ? { ...n, texto: nuevoTexto } : n)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },



  cerrarTurno: () => {
    const state = getStore();
    const date = new Date();
    const hoyStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const noCompletadas = state.kanbanTareas.filter(t => t.estado !== 'Completado');
    const caducanHoy = state.kanbanTareas.filter(t => t.fechaCaducidad === hoyStr);
    const agotados = state.agotados86;
    const notas = state.notasPostIt;
    
    let texto = `*CIERRE DE TURNO - ${state.turnoActual.nombreServicio.toUpperCase()}*\n`;
    texto += `Pax: ${state.turnoActual.comensales}\n\n`;
    
    texto += `*⚠️ TAREAS PENDIENTES (${noCompletadas.length}):*\n`;
    if (noCompletadas.length > 0) {
      noCompletadas.forEach(t => {
        texto += `- [${t.partida}] ${t.nombre}${t.cantidad ? ` (${t.cantidad} ${t.unidad || 'Kg'})` : ' [Acción]'} [${t.estado}]\n`;
      });
    } else {
      texto += `- Ninguna\n`;
    }

    
    texto += `\n*🛑 PLATOS AGOTADOS / FUERA DE CARTA (${agotados.length}):*\n`;
    if (agotados.length > 0) {
      agotados.forEach(a => {
        texto += `- [${a.partida}] ${a.nombre} (${a.hora})\n`;
      });
    } else {
      texto += `- Ninguno\n`;
    }
    
    texto += `\n*⏳ CADUCAN HOY (${caducanHoy.length}):*\n`;
    if (caducanHoy.length > 0) {
      caducanHoy.forEach(t => {
        texto += `- [${t.partida}] ${t.nombre}\n`;
      });
    } else {
      texto += `- Ninguno\n`;
    }
    
    texto += `\n*📌 NOTAS POST-IT (${notas.length}):*\n`;
    if (notas.length > 0) {
      notas.forEach(n => {
        texto += `- ${n.texto}\n`;
      });
    } else {
      texto += `- Ninguna\n`;
    }
    
    if (navigator.share) {
      navigator.share({
        title: 'Cierre de Turno',
        text: texto
      }).catch(console.error);
    } else {
      const url = "https://wa.me/?text=" + encodeURIComponent(texto);
      window.open(url, '_blank');
    }
  },

  guardarProcesoHabitual: (proceso) => {
    setStore((state) => {
      const existe = state.procesosHabituales.some(
        p => p.partida === proceso.partida && p.nombre.toLowerCase() === proceso.nombre.toLowerCase()
      );
      if (existe) return state;
      const nuevo: ProcesoHabitual = {
        id: crypto.randomUUID(),
        ...proceso
      };
      const newState = { procesosHabituales: [nuevo, ...state.procesosHabituales] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarProcesoHabitual: (id) => {
    setStore((state) => {
      const newState = { procesosHabituales: state.procesosHabituales.filter(p => p.id !== id) };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  limpiarCompletadas: (partida) => {
    setStore((state) => {
      const newState = {
        kanbanTareas: state.kanbanTareas.filter(t => {
          if (partida === 'todas') return t.estado !== 'Completado';
          return !(t.partida === partida && t.estado === 'Completado');
        })
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },



  registrarLecturaAPPCC: (registro) => {
    setStore((state) => {
      const nuevo: RegistroAPPCC = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...registro
      };
      const newState = { registrosAPPCC: [nuevo, ...state.registrosAPPCC] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  actualizarPuntosControlAPPCC: (puntos) => {
    setStore((state) => {
      const newState = { puntosControlAPPCC: puntos };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  actualizarDatosEstablecimientoAPPCC: (datos) => {
    setStore((state) => {
      const newState = {
        datosEstablecimientoAPPCC: { ...state.datosEstablecimientoAPPCC, ...datos }
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarRegistroAPPCC: (id) => {
    setStore((state) => {
      const newState = {
        registrosAPPCC: state.registrosAPPCC.filter(r => r.id !== id)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  }
}));

