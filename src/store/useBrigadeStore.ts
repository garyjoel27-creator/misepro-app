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
  cantidad: number;
  unidad: string;
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

export interface PlatoDelDia {
  id: string;
  nombre: string;
  partida: string;
  descripcion?: string;
}

export interface Compra {
  id: string;
  ingrediente: string;
  cantidad: number;
  categoria: 'Vegetales' | 'Proteinas' | 'Lacteos/Secos';
}

export interface SugerenciaIA {
  id: string;
  ingrediente: string;
  cantidadSugerida: number;
  categoria: 'Vegetales' | 'Proteinas' | 'Lacteos/Secos';
  motivo: string;
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

export interface StockInterno {
  id: string;
  nombre: string;
  cantidad: number;
}

export interface NotaPostIt {
  id: string;
  texto: string;
  timestamp: number;
}

export interface BrigadeState {
  turnoActual: TurnoData;
  partidas: string[];
  kanbanTareas: Tarea[];
  comprasPendientes: Compra[];
  sugerenciasIA: SugerenciaIA[];
  analizandoIA: boolean;
  
  // Modo Servicio & Herramientas en Pase
  modoServicio: boolean;
  temporizadores: Temporizador[];
  agotados86: Item86[];
  
  // Escalamiento Operativo V2
  pinJefe: string | null;
  isChefMode: boolean;
  stockInterno: StockInterno[];
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
  resetearTurno: (nuevoServicio?: string, pax?: number) => void;
  agregarPartida: (nombre: string) => void;
  eliminarPartida: (nombre: string) => void;
  agregarTarea: (tarea: Tarea) => void;
  actualizarTarea: (id: string, cambios: Partial<Tarea>) => void;
  eliminarTarea: (id: string) => void;
  moverTarea: (id: string, nuevoEstado: Tarea['estado']) => void;
  agregarCompra: (compra: Compra) => void;
  cargarDatos: () => Promise<void>;
  vaciarCompras: () => void;
  analizarEscandallo: () => Promise<void>;
  aceptarSugerencia: (id: string) => void;
  descartarSugerencia: (id: string) => void;

  // Acciones V2
  toggleChefMode: (pin?: string) => boolean;
  setPinJefe: (pin: string | null) => void;
  toggleModoZen: () => void;
  agregarNotaPostIt: (texto: string) => void;
  editarNotaPostIt: (id: string, nuevoTexto: string) => void;
  eliminarNotaPostIt: (id: string) => void;
  actualizarStockInterno: (id: string, delta: number) => void;
  agregarStockInterno: (nombre: string, cantidadInicial?: number) => void;
  eliminarStockInterno: (id: string) => void;
  cerrarTurno: () => void;

  // Catálogo de Procesos Habituales & Control de Limpieza
  procesosHabituales: ProcesoHabitual[];
  guardarProcesoHabitual: (proceso: Omit<ProcesoHabitual, 'id'>) => void;
  eliminarProcesoHabitual: (id: string) => void;
  limpiarCompletadas: (partida: string) => void;

  // Platos del Día / Especiales del Servicio
  platosDelDia: PlatoDelDia[];
  agregarPlatoDelDia: (plato: Omit<PlatoDelDia, 'id'>) => void;
  eliminarPlatoDelDia: (id: string) => void;
}

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

export const useBrigadeStore = create<BrigadeState>((setStore, getStore) => ({
  turnoActual: {
    nombreServicio: 'Cena',
    comensales: 120,
    horaPase: '20:30',
  },
  partidas: ['Saucier', 'Garde Manger', 'Pescados', 'Carnes'],
  sugerenciasIA: [],
  analizandoIA: false,
  procesosHabituales: PROCESOS_HABITUALES_INICIALES,
  kanbanTareas: [
    { id: '1', nombre: 'Fondo Oscuro', cantidad: 10, unidad: 'Litros', prioridad: 'Critica', estado: 'Pendiente', partida: 'Saucier' },
    { id: '2', nombre: 'Beurre Blanc', cantidad: 2, unidad: 'Litros', prioridad: 'Media', estado: 'En Proceso', partida: 'Saucier' },
    { id: '3', nombre: 'Mirepoix', cantidad: 5, unidad: 'Kg', prioridad: 'Baja', estado: 'Completado', partida: 'Garde Manger' },
    { id: '4', nombre: 'Despiece Solomillo', cantidad: 8, unidad: 'Kg', prioridad: 'Critica', estado: 'Pendiente', partida: 'Carnes' },
    { id: '5', nombre: 'Limpieza Merluza', cantidad: 5, unidad: 'Kg', prioridad: 'Media', estado: 'Pendiente', partida: 'Pescados' }
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
  stockInterno: [
    { id: 'stock-1', nombre: 'Raciones Pan', cantidad: 12 },
    { id: 'stock-2', nombre: 'Mantequilla Ahumada', cantidad: 5 }
  ],
  platosDelDia: [
    { id: 'esp-1', nombre: 'Arroz meloso de carabinero', partida: 'Saucier', descripcion: 'Fondo de roca y azafrán' },
    { id: 'esp-2', nombre: 'Lomo de corvina a la brasa', partida: 'Pescados', descripcion: 'Bilbaína suave y verduritas' }
  ],
  notasPostIt: [],
  modoZen: false,

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
              estado: (restante > 0 ? 'pausado' : 'terminado') as Temporizador['estado']
            };
          }
          const nuevoFin = t.finTimestamp + deltaSegundos * 1000;
          return { 
            ...t, 
            finTimestamp: nuevoFin, 
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
      sugerenciasIA: [],
      agotados86: [],
      notasPostIt: []
    });
    set('brigade-sync-store', getStore());
  },

  agregarPartida: (nombre) => {
    setStore((state) => {
      if (state.partidas.includes(nombre)) return state;
      const newState = { partidas: [...state.partidas, nombre] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarPartida: (nombre) => {
    setStore((state) => {
      const newState = { 
        partidas: state.partidas.filter(p => p !== nombre),
        kanbanTareas: state.kanbanTareas.filter(t => t.partida !== nombre) 
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
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
        const mergedData = {
           ...data,
           kanbanTareas: data.kanbanTareas?.length > 0 ? data.kanbanTareas : getStore().kanbanTareas,
           partidas: data.partidas?.length > 0 ? data.partidas : getStore().partidas,
           temporizadores: data.temporizadores ?? getStore().temporizadores,
           agotados86: data.agotados86 ?? getStore().agotados86,
           modoServicio: data.modoServicio ?? false,
           isChefMode: data.isChefMode ?? false,
           pinJefe: data.pinJefe !== undefined ? data.pinJefe : '1234',
           stockInterno: data.stockInterno ?? getStore().stockInterno,
           notasPostIt: data.notasPostIt ?? [],
           modoZen: data.modoZen ?? false,
           procesosHabituales: data.procesosHabituales?.length > 0 ? data.procesosHabituales : getStore().procesosHabituales,
           platosDelDia: data.platosDelDia ?? getStore().platosDelDia
        };
        setStore(mergedData);
      }
    } catch (e) {
      console.error('Error loading data from IndexedDB', e);
    }
  },

  analizarEscandallo: async () => {
    if (getStore().analizandoIA) return;
    setStore({ analizandoIA: true });
    try {
      const state = getStore();
      const { turnoActual, kanbanTareas } = state;
      console.log('Enviando datos al Edge Function (mock):', { turnoActual, kanbanTareas });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const mockResponse = {
        sugerencias: [
          {
            id: crypto.randomUUID(),
            ingrediente: 'Mantequilla',
            cantidadSugerida: 2,
            categoria: 'Lacteos/Secos',
            motivo: 'Alta demanda proyectada de Beurre Blanc y bajo stock estimado por 120 pax.'
          },
          {
            id: crypto.randomUUID(),
            ingrediente: 'Cebolla',
            cantidadSugerida: 5,
            categoria: 'Vegetales',
            motivo: 'Necesario para aumentar la producción de Mirepoix y Fondo Oscuro.'
          }
        ]
      };

      setStore((prevState) => {
        const newState = { sugerenciasIA: mockResponse.sugerencias as SugerenciaIA[], analizandoIA: false };
        set('brigade-sync-store', { ...prevState, ...newState });
        return newState;
      });
    } catch (error) {
      console.error('Error al analizar escandallo con IA:', error);
      setStore({ analizandoIA: false });
    }
  },

  aceptarSugerencia: (id) => {
    setStore((state) => {
      const sugerencia = state.sugerenciasIA.find(s => s.id === id);
      if (sugerencia) {
        const existingIndex = state.comprasPendientes.findIndex(
          c => c.ingrediente.toLowerCase() === sugerencia.ingrediente.toLowerCase()
        );

        let newComprasPendientes;
        if (existingIndex >= 0) {
          newComprasPendientes = [...state.comprasPendientes];
          newComprasPendientes[existingIndex] = {
            ...newComprasPendientes[existingIndex],
            cantidad: newComprasPendientes[existingIndex].cantidad + sugerencia.cantidadSugerida
          };
        } else {
          const nuevaCompra: Compra = {
            id: crypto.randomUUID(),
            ingrediente: sugerencia.ingrediente,
            cantidad: sugerencia.cantidadSugerida,
            categoria: sugerencia.categoria
          };
          newComprasPendientes = [...state.comprasPendientes, nuevaCompra];
        }

        const newState = {
          comprasPendientes: newComprasPendientes,
          sugerenciasIA: state.sugerenciasIA.filter(s => s.id !== id)
        };
        set('brigade-sync-store', { ...state, ...newState });
        return newState;
      }
      return state;
    });
  },

  descartarSugerencia: (id) => {
    setStore((state) => {
      const newState = {
        sugerenciasIA: state.sugerenciasIA.filter(s => s.id !== id)
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
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

  actualizarStockInterno: (id: string, delta: number) => {
    setStore((state) => {
      const newState = {
        stockInterno: state.stockInterno.map(s => 
          s.id === id ? { ...s, cantidad: Math.max(0, s.cantidad + delta) } : s
        )
      };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  agregarStockInterno: (nombre: string, cantidadInicial = 0) => {
    setStore((state) => {
      const nuevo: StockInterno = {
        id: crypto.randomUUID(),
        nombre,
        cantidad: cantidadInicial
      };
      const newState = { stockInterno: [...state.stockInterno, nuevo] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarStockInterno: (id: string) => {
    setStore((state) => {
      const newState = { stockInterno: state.stockInterno.filter(s => s.id !== id) };
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
        texto += `- [${t.partida}] ${t.nombre} (${t.cantidad} ${t.unidad}) [${t.estado}]\n`;
      });
    } else {
      texto += `- Ninguna\n`;
    }

    const platos = state.platosDelDia;
    if (platos.length > 0) {
      texto += `\n*🌟 ESPECIALES / PLATOS DEL DÍA (${platos.length}):*\n`;
      platos.forEach(p => {
        texto += `- [${p.partida}] ${p.nombre}${p.descripcion ? ` (${p.descripcion})` : ''}\n`;
      });
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

  agregarPlatoDelDia: (plato) => {
    setStore((state) => {
      const nuevo: PlatoDelDia = {
        id: crypto.randomUUID(),
        ...plato
      };
      const newState = { platosDelDia: [nuevo, ...state.platosDelDia] };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  },

  eliminarPlatoDelDia: (id) => {
    setStore((state) => {
      const newState = { platosDelDia: state.platosDelDia.filter(p => p.id !== id) };
      set('brigade-sync-store', { ...state, ...newState });
      return newState;
    });
  }
}));

