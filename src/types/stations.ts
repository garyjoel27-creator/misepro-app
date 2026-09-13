import { Flame, Salad, Fish, Beef, UtensilsCrossed } from 'lucide-react';
import type { ComponentType } from 'react';

export type StationName = 'Saucier' | 'Garde Manger' | 'Pescados' | 'Carnes';

export interface StationConfig {
  id: StationName;
  name: StationName;
  label: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  primaryColor: string;
  accentColor: string;
  tab: {
    active: string;
    badge: string;
    borderAccent: string;
  };
  column: {
    borderAccent: string;
    headerIcon: string;
    countBadge: string;
    dragOver: string;
  };
  card: {
    tag: string;
    hoverBorder: string;
    dragging: string;
    dot: string;
  };
}

export const STATIONS_CONFIG: Record<StationName, StationConfig> = {
  Saucier: {
    id: 'Saucier',
    name: 'Saucier',
    label: 'Partida Saucier',
    subtitle: 'Salsas, Caldos & Reducciones',
    icon: Flame,
    primaryColor: '#f59e0b',
    accentColor: '#d97706',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-amber-500/20 data-[state=active]:to-amber-500/5 data-[state=active]:text-amber-500 dark:data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/60 data-[state=active]:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
      badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20',
      borderAccent: 'border-amber-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-amber-500',
      headerIcon: 'text-amber-500 dark:text-amber-400',
      countBadge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
      dragOver: 'bg-amber-500/10 ring-2 ring-amber-500/40 border-amber-500/40'
    },
    card: {
      tag: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      dragging: 'border-amber-500 ring-4 ring-amber-500/30 bg-amber-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-amber-500'
    }
  },
  'Garde Manger': {
    id: 'Garde Manger',
    name: 'Garde Manger',
    label: 'Partida Garde Manger',
    subtitle: 'Cuarto Frío, Ensaladas & Vegetales',
    icon: Salad,
    primaryColor: '#10b981',
    accentColor: '#059669',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-emerald-500/20 data-[state=active]:to-emerald-500/5 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/60 data-[state=active]:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20',
      borderAccent: 'border-emerald-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-emerald-500',
      headerIcon: 'text-emerald-500 dark:text-emerald-400',
      countBadge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      dragOver: 'bg-emerald-500/10 ring-2 ring-emerald-500/40 border-emerald-500/40'
    },
    card: {
      tag: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      dragging: 'border-emerald-500 ring-4 ring-emerald-500/30 bg-emerald-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-emerald-500'
    }
  },
  Pescados: {
    id: 'Pescados',
    name: 'Pescados',
    label: 'Partida Poissonier',
    subtitle: 'Mariscos, Pescados & Fondos Marinos',
    icon: Fish,
    primaryColor: '#0284c7',
    accentColor: '#06b6d4',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-sky-500/20 data-[state=active]:to-sky-500/5 data-[state=active]:text-sky-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/60 data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      badge: 'bg-sky-500/20 text-sky-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20',
      borderAccent: 'border-cyan-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-cyan-500',
      headerIcon: 'text-sky-500 dark:text-cyan-400',
      countBadge: 'bg-sky-500/20 text-sky-700 dark:text-cyan-300 border border-cyan-500/30',
      dragOver: 'bg-sky-500/10 ring-2 ring-cyan-500/40 border-cyan-500/40'
    },
    card: {
      tag: 'bg-sky-500/15 text-sky-700 dark:text-cyan-400 border border-cyan-500/30',
      hoverBorder: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      dragging: 'border-cyan-500 ring-4 ring-cyan-500/30 bg-sky-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-cyan-500'
    }
  },
  Carnes: {
    id: 'Carnes',
    name: 'Carnes',
    label: 'Partida Rôtisseur',
    subtitle: 'Asados, Cortes & Despieces',
    icon: Beef,
    primaryColor: '#ef4444',
    accentColor: '#b91c1c',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-red-500/20 data-[state=active]:to-red-500/5 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:border-red-500/60 data-[state=active]:shadow-[0_0_20px_rgba(239,68,68,0.25)]',
      badge: 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20',
      borderAccent: 'border-red-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-red-500',
      headerIcon: 'text-red-500 dark:text-red-400',
      countBadge: 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30',
      dragOver: 'bg-red-500/10 ring-2 ring-red-500/40 border-red-500/40'
    },
    card: {
      tag: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30',
      hoverBorder: 'hover:border-red-500/50 hover:shadow-red-500/10',
      dragging: 'border-red-500 ring-4 ring-red-500/30 bg-red-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-red-500'
    }
  }
};

const DEFAULT_STATION_CONFIG: StationConfig = {
  id: 'Saucier',
  name: 'Saucier',
  label: 'Partida de Cocina',
  subtitle: 'Preparaciones & Cocina',
  icon: UtensilsCrossed,
  primaryColor: '#f59e0b',
  accentColor: '#d97706',
  tab: {
    active: 'data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 data-[state=active]:border-amber-500/50',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    borderAccent: 'border-amber-500/50'
  },
  column: {
    borderAccent: 'border-t-2 border-t-amber-500',
    headerIcon: 'text-amber-500',
    countBadge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    dragOver: 'bg-amber-500/10 ring-2 ring-amber-500/40'
  },
  card: {
    tag: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    dragging: 'border-amber-500 ring-4 ring-amber-500/30 bg-amber-500/10',
    dot: 'bg-amber-500'
  }
};

export function getStationConfig(stationName: string): StationConfig {
  if (stationName in STATIONS_CONFIG) {
    return STATIONS_CONFIG[stationName as StationName];
  }
  return DEFAULT_STATION_CONFIG;
}

export function isKnownStation(stationName: string): stationName is StationName {
  return stationName in STATIONS_CONFIG;
}
