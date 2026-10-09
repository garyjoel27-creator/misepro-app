import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ClipboardCheck, X, Plus, Check, RotateCcw, Trash2, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export interface StationSOPModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function StationSOPModal({ open, isOpen, onOpenChange, onClose }: StationSOPModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const { isDark } = useTheme();
  const { 
    partidas, 
    itemsSOP, 
    toggleItemSOP, 
    reiniciarChecklistSOP, 
    agregarItemSOP, 
    eliminarItemSOP
  } = useBrigadeStore();

  const [momentoActivo, setMomentoActivo] = useState<'apertura' | 'cierre'>('apertura');
  const [filtroPartida, setFiltroPartida] = useState<string>('todas');
  const [nuevoTexto, setNuevoTexto] = useState('');

  const itemsFiltrados = itemsSOP.filter(item => {
    if (item.momento !== momentoActivo) return false;
    if (filtroPartida === 'todas') return true;
    return item.partida === filtroPartida || (!item.partida && filtroPartida === 'General');
  });

  const total = itemsFiltrados.length;
  const completados = itemsFiltrados.filter(i => i.completado).length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 100;

  const handleToggle = (id: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(30); } catch {}
    }
    toggleItemSOP(id, 'Brigada');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTexto.trim()) return;
    agregarItemSOP(nuevoTexto.trim(), momentoActivo, filtroPartida === 'todas' ? undefined : filtroPartida);
    setNuevoTexto('');
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
        <Dialog.Content className={`fixed inset-x-3 sm:inset-x-auto top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-50 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl p-4 sm:p-6 overflow-y-auto ${
          isDark 
            ? 'bg-[#0f1422] border-emerald-500/30 text-white' 
            : 'bg-white border-stone-300 text-stone-900'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-black">
                <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-serif font-black tracking-wide text-emerald-500 dark:text-emerald-400">
                  Checklists de Apertura y Cierre (SOPs)
                </Dialog.Title>
                <Dialog.Description className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Protocolos Operativos Estandarizados de Cocina
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 my-4 flex-1">
            {/* Selector de Momento (Apertura vs Cierre) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMomentoActivo('apertura')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  momentoActivo === 'apertura'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                    : 'text-stone-500 dark:text-slate-400 hover:text-amber-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>🌅 Apertura</span>
              </button>

              <button
                type="button"
                onClick={() => setMomentoActivo('cierre')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  momentoActivo === 'cierre'
                    ? 'bg-blue-600 text-white shadow-md font-black'
                    : 'text-stone-500 dark:text-slate-400 hover:text-blue-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>🌙 Cierre</span>
              </button>
            </div>

            {/* Gran Barra de Progreso */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Progreso {momentoActivo === 'apertura' ? 'de Apertura' : 'de Cierre'}
                </span>
                <span className={`text-xs font-black font-mono ${porcentaje === 100 ? 'text-emerald-500 font-bold' : 'text-amber-500'}`}>
                  {porcentaje}% ({completados} de {total})
                </span>
              </div>
              
              <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    porcentaje === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>

              {porcentaje === 100 && (
                <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1.5 animate-in fade-in">
                  <ShieldCheck className="w-4 h-4" />
                  <span>¡Todo verificado y conforme para el turno!</span>
                </p>
              )}
            </div>

            {/* Filtro por Partida */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFiltroPartida('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  filtroPartida === 'todas'
                    ? 'bg-stone-800 text-white border border-stone-700'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Toda la Cocina
              </button>
              {partidas.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFiltroPartida(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    filtroPartida === p
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Lista Táctil de Chequeos SOP */}
            <div className="space-y-2 max-h-[35vh] overflow-y-auto">
              {itemsFiltrados.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-98 ${
                    item.completado
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-stone-900 dark:text-emerald-100'
                      : 'bg-white dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                        item.completado
                          ? 'bg-emerald-500 border-emerald-400 text-stone-950'
                          : 'border-stone-400 dark:border-slate-600 bg-transparent'
                      }`}
                    >
                      {item.completado && <Check className="w-5 h-5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-bold leading-tight ${item.completado ? 'line-through opacity-70' : ''}`}>
                        {item.texto}
                      </p>
                      {item.partida && (
                        <span className="text-[10px] uppercase font-bold text-amber-500 dark:text-amber-400 block mt-0.5">
                          Partida: {item.partida}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarItemSOP(item.id);
                    }}
                    className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Eliminar este punto de control"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Añadir nuevo punto de control */}
            <form onSubmit={handleAdd} className="flex gap-2 pt-1">
              <input
                type="text"
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                placeholder={`+ Añadir nuevo punto de control para ${momentoActivo}...`}
                className="flex-1 px-3 py-2 rounded-xl border text-xs font-semibold bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Reiniciar el checklist de ${momentoActivo} para el próximo turno?`)) {
                  reiniciarChecklistSOP(momentoActivo);
                }
              }}
              className="text-xs font-bold text-stone-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar {momentoActivo}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Entendido / Cerrar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
