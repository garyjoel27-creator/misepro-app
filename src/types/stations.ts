import { Flame, Salad, Fish, Beef, Sparkles, ChefHat, Pizza, Soup } from 'lucide-react';
import type { ComponentType } from 'react';

export type StationName = string;

export type StationColorKey = 'amber' | 'emerald' | 'sky' | 'red' | 'purple' | 'orange';

export interface StationColorTheme {
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

export const COLOR_THEME_LABELS: Record<StationColorKey, string> = {
  amber: 'Ámbar Coñac',
  emerald: 'Esmeralda Fresca',
  sky: 'Zafiro Océano',
  red: 'Rubí Carmesí',
  purple: 'Amatista Noble',
  orange: 'Fuego Bronce'
};

export const STATION_COLOR_THEMES: Record<StationColorKey, StationColorTheme> = {
  amber: {
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
  emerald: {
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
  sky: {
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
  red: {
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
  },
  purple: {
    primaryColor: '#a855f7',
    accentColor: '#7e22ce',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-purple-500/20 data-[state=active]:to-purple-500/5 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/60 data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20',
      borderAccent: 'border-purple-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-purple-500',
      headerIcon: 'text-purple-500 dark:text-purple-400',
      countBadge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
      dragOver: 'bg-purple-500/10 ring-2 ring-purple-500/40 border-purple-500/40'
    },
    card: {
      tag: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      dragging: 'border-purple-500 ring-4 ring-purple-500/30 bg-purple-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-purple-500'
    }
  },
  orange: {
    primaryColor: '#f97316',
    accentColor: '#c2410c',
    tab: {
      active: 'data-[state=active]:bg-gradient-to-b data-[state=active]:from-orange-500/20 data-[state=active]:to-orange-500/5 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:border-orange-500/60 data-[state=active]:shadow-[0_0_20px_rgba(249,115,22,0.25)]',
      badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/20',
      borderAccent: 'border-orange-500/60'
    },
    column: {
      borderAccent: 'border-t-2 border-t-orange-500',
      headerIcon: 'text-orange-500 dark:text-orange-400',
      countBadge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30',
      dragOver: 'bg-orange-500/10 ring-2 ring-orange-500/40 border-orange-500/40'
    },
    card: {
      tag: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30',
      hoverBorder: 'hover:border-orange-500/50 hover:shadow-orange-500/10',
      dragging: 'border-orange-500 ring-4 ring-orange-500/30 bg-orange-50/50 dark:bg-slate-800 shadow-2xl',
      dot: 'bg-orange-500'
    }
  }
};

export interface StationConfig {
  id: string;
  name: string;
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

// Mapeo clásico precargado
export const STATIONS_CONFIG: Record<string, StationConfig> = {
  Saucier: {
    id: 'Saucier',
    name: 'Saucier',
    label: 'Partida Saucier',
    subtitle: 'Salsas, Caldos & Reducciones',
    icon: Flame,
    ...STATION_COLOR_THEMES.amber
  },
  'Garde Manger': {
    id: 'Garde Manger',
    name: 'Garde Manger',
    label: 'Partida Garde Manger',
    subtitle: 'Cuarto Frío, Ensaladas & Vegetales',
    icon: Salad,
    ...STATION_COLOR_THEMES.emerald
  },
  Pescados: {
    id: 'Pescados',
    name: 'Pescados',
    label: 'Partida Poissonier',
    subtitle: 'Mariscos, Pescados & Fondos Marinos',
    icon: Fish,
    ...STATION_COLOR_THEMES.sky
  },
  Carnes: {
    id: 'Carnes',
    name: 'Carnes',
    label: 'Partida Rôtisseur',
    subtitle: 'Asados, Cortes & Despieces',
    icon: Beef,
    ...STATION_COLOR_THEMES.red
  }
};

function deduceIcon(name: string): ComponentType<{ className?: string }> {
  const n = name.toLowerCase();
  if (n.includes('fuego') || n.includes('salsa') || n.includes('caldo') || n.includes('saucier') || n.includes('horno')) return Flame;
  if (n.includes('frio') || n.includes('frío') || n.includes('ensalada') || n.includes('verde') || n.includes('vegetal') || n.includes('garde')) return Salad;
  if (n.includes('pescado') || n.includes('marisco') || n.includes('mar') || n.includes('sushi')) return Fish;
  if (n.includes('carne') || n.includes('brasa') || n.includes('parrilla') || n.includes('asador') || n.includes('chuletero')) return Beef;
  if (n.includes('postre') || n.includes('dulce') || n.includes('pastel') || n.includes('reposteria') || n.includes('repostería')) return Sparkles;
  if (n.includes('pasta') || n.includes('pizza') || n.includes('harina')) return Pizza;
  if (n.includes('sopa') || n.includes('arroz') || n.includes('plancha')) return Soup;
  return ChefHat;
}

function getDeterministicColor(name: string): StationColorKey {
  const keys: StationColorKey[] = ['amber', 'emerald', 'sky', 'red', 'purple', 'orange'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return keys[index];
}

export function getStationConfig(stationName: string, customColorKey?: string): StationConfig {
  if (stationName in STATIONS_CONFIG && !customColorKey) {
    return STATIONS_CONFIG[stationName];
  }

  const validKey: StationColorKey = 
    (customColorKey && customColorKey in STATION_COLOR_THEMES)
      ? (customColorKey as StationColorKey)
      : getDeterministicColor(stationName);

  const theme = STATION_COLOR_THEMES[validKey];
  const icon = deduceIcon(stationName);

  return {
    id: stationName,
    name: stationName,
    label: `Partida ${stationName}`,
    subtitle: `Preparaciones de ${stationName}`,
    icon,
    ...theme
  };
}

export function isKnownStation(stationName: string): boolean {
  return Boolean(stationName && stationName.trim().length > 0);
}
