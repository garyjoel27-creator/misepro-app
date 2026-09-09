import { create } from 'zustand';
import { get, set } from 'idb-keyval';

export interface TurnoData {
  nombreServicio: string;
  comensales: number;
}

export interface Tarea {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  prioridad: 'Critica' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'En Proceso' | 'Completado';
  partida: string;
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

export interface BrigadeState {
  turnoActual: TurnoData;
  kanbanTareas: Tarea[];
  comprasPendientes: Compra[];
  sugerenciasIA: SugerenciaIA[];
  analizandoIA: boolean;
  
  setTurnoActual: (turno: TurnoData) => void;
  agregarTarea: (tarea: Tarea) => void;
  moverTarea: (id: string, nuevoEstado: Tarea['estado']) => void;
  agregarCompra: (compra: Compra) => void;
  cargarDatos: () => Promise<void>;
  vaciarCompras: () => void;
  analizarEscandallo: () => Promise<void>;
  aceptarSugerencia: (id: string) => void;
  descartarSugerencia: (id: string) => void;
}

export const useBrigadeStore = create<BrigadeState>((setStore, getStore) => ({
  turnoActual: {
    nombreServicio: 'Cena',
    comensales: 120,
  },
  sugerenciasIA: [],
  analizandoIA: false,
  kanbanTareas: [
    { id: '1', nombre: 'Fondo Oscuro', cantidad: 10, unidad: 'Litros', prioridad: 'Critica', estado: 'Pendiente', partida: 'Saucier' },
    { id: '2', nombre: 'Beurre Blanc', cantidad: 2, unidad: 'Litros', prioridad: 'Media', estado: 'En Proceso', partida: 'Saucier' },
    { id: '3', nombre: 'Mirepoix', cantidad: 5, unidad: 'Kg', prioridad: 'Baja', estado: 'Completado', partida: 'Garde Manger' },
    { id: '4', nombre: 'Despiece Solomillo', cantidad: 8, unidad: 'Kg', prioridad: 'Critica', estado: 'Pendiente', partida: 'Carnes' },
    { id: '5', nombre: 'Limpieza Merluza', cantidad: 5, unidad: 'Kg', prioridad: 'Media', estado: 'Pendiente', partida: 'Pescados' }
  ],
  comprasPendientes: [],

  setTurnoActual: (turno) => {
    setStore({ turnoActual: turno });
    set('brigade-sync-store', getStore());
  },
  
  agregarTarea: (tarea) => {
    setStore((state) => {
      const newState = { kanbanTareas: [...state.kanbanTareas, tarea] };
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
        // Keep dummy data if loaded kanbanTareas is empty, otherwise use loaded data
        const mergedData = {
           ...data,
           kanbanTareas: data.kanbanTareas?.length > 0 ? data.kanbanTareas : getStore().kanbanTareas
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

      // Simulamos la llamada a una Edge Function (fetch API mockup)
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
}));
