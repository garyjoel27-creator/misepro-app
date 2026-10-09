import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X, Plus, Send } from 'lucide-react';
import { useBrigadeStore, type RegistroMerma } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export interface FoodWasteModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

const MOTIVOS_MERMA: { valor: RegistroMerma['motivo']; label: string; icon: string }[] = [
  { valor: 'Coccion', label: 'Cocción / Quemado', icon: '🔥' },
  { valor: 'Caducidad', label: 'Caducidad / Cámara', icon: '⏳' },
  { valor: 'Caida/Rotura', label: 'Caída / Rotura', icon: '💥' },
  { valor: 'Manipulacion', label: 'Corte / Manipulación', icon: '🔪' },
  { valor: 'Devolucion', label: 'Devolución Sala', icon: '🍽️' },
  { valor: 'Otro', label: 'Otro Desperdicio', icon: '📦' }
];

export function FoodWasteModal({ open, isOpen, onOpenChange, onClose }: FoodWasteModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const { isDark } = useTheme();
  const { 
    partidas, 
    registrosMermas, 
    registrarMerma, 
    eliminarMerma, 
    vaciarMermas,
    nombreRestaurante 
  } = useBrigadeStore();

  const [nombre, setNombre] = useState('');
  const [partida, setPartida] = useState(partidas[0] || 'Cocina');
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidad, setUnidad] = useState('Kg');
  const [motivo, setMotivo] = useState<RegistroMerma['motivo']>('Coccion');
  const [costeEstimado, setCosteEstimado] = useState<number | undefined>(undefined);
  const responsable = 'Brigada';

  const handleAddMerma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || cantidad <= 0) return;

    registrarMerma({
      nombre: nombre.trim(),
      partida,
      cantidad,
      unidad,
      motivo,
      costeEstimado: costeEstimado ? Number(costeEstimado) : undefined,
      responsable: responsable.trim() || undefined
    });

    setNombre('');
    setCantidad(1);
    setCosteEstimado(undefined);
  };

  const handleWhatsAppMermas = () => {
    if (registrosMermas.length === 0) return;
    const now = new Date();
    let text = `🚨 *REPORTE DE MERMAS Y DESPERDICIO - ${nombreRestaurante}* [${now.toLocaleDateString()}]\n\n`;
    text += `Se han registrado las siguientes mermas durante el turno:\n\n`;
    
    let totalKilos = 0;
    let totalCoste = 0;

    registrosMermas.forEach((m, idx) => {
      text += `${idx + 1}. *${m.nombre}* (${m.partida}) - ${m.cantidad} ${m.unidad} [${m.motivo}] a las ${m.hora}\n`;
      if (m.unidad.toLowerCase() === 'kg') totalKilos += m.cantidad;
      if (m.costeEstimado) totalCoste += m.costeEstimado;
    });

    if (totalCoste > 0) {
      text += `\n💰 *Pérdida económica estimada:* ~${totalCoste.toFixed(2)} €\n`;
    }
    text += `\n⚠️ Registrar en el escandallo para control de Food Cost.`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const totalCoste = registrosMermas.reduce((acc, m) => acc + (m.costeEstimado || 0), 0);

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
        <Dialog.Content className={`fixed inset-x-3 sm:inset-x-auto top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-50 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl p-4 sm:p-6 overflow-y-auto ${
          isDark 
            ? 'bg-[#0f1422] border-red-500/30 text-white' 
            : 'bg-white border-stone-300 text-stone-900'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center font-black">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-serif font-black tracking-wide text-red-500 dark:text-red-400">
                  Control de Mermas y Desperdicio
                </Dialog.Title>
                <Dialog.Description className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Food Waste Tracker • Control de Pérdidas y Food Cost
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
            {/* Formulario Exprés de Registro */}
            <form onSubmit={handleAddMerma} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-red-500 block">
                + Registrar Nueva Merma en 10 Segundos
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Producto o preparación (ej. Salsa de vino cortada, Solomillo)"
                    className="w-full px-3.5 py-2 rounded-xl border text-sm font-bold bg-white dark:bg-slate-950 border-stone-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl border text-sm font-black text-center bg-white dark:bg-slate-950 border-stone-300 dark:border-slate-700"
                    required
                  />
                  <select
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-950 border-stone-300 dark:border-slate-700"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Litros">Litros</option>
                    <option value="Gramos">Gramos</option>
                    <option value="Unidades">Unidades</option>
                    <option value="Raciones">Raciones</option>
                  </select>
                </div>

                <div>
                  <select
                    value={partida}
                    onChange={(e) => setPartida(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-950 border-stone-300 dark:border-slate-700"
                  >
                    {partidas.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de 1 toque para el motivo */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5">
                  Motivo de la Pérdida:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {MOTIVOS_MERMA.map(m => (
                    <button
                      key={m.valor}
                      type="button"
                      onClick={() => setMotivo(m.valor)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                        motivo === m.valor 
                          ? 'bg-red-500/20 text-red-400 border-red-500/60 ring-2 ring-red-500/30' 
                          : 'bg-white dark:bg-slate-950 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={costeEstimado || ''}
                    onChange={(e) => setCosteEstimado(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Coste aprox. en € (opcional)"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-950 border-stone-300 dark:border-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md transition-transform active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Añadir</span>
                </button>
              </div>
            </form>

            {/* Listado de Mermas del Turno */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Historial de Mermas ({registrosMermas.length})
                </span>
                {totalCoste > 0 && (
                  <span className="text-xs font-black text-red-500 font-mono bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                    Pérdida: ~{totalCoste.toFixed(2)} €
                  </span>
                )}
              </div>

              {registrosMermas.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-stone-300 dark:border-slate-800 bg-stone-50 dark:bg-slate-900/40">
                  <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold">
                    No hay mermas registradas en este turno. ¡Cocina limpia y eficiente! 🎉
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[30vh] overflow-y-auto">
                  {registrosMermas.map(m => (
                    <div 
                      key={m.id}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-lg">
                          {MOTIVOS_MERMA.find(x => x.valor === m.motivo)?.icon || '🗑️'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate text-stone-900 dark:text-white">
                            {m.nombre}
                          </p>
                          <p className="text-[10px] text-stone-400 font-semibold truncate">
                            {m.partida} • {m.cantidad} {m.unidad} • {m.hora}
                            {m.costeEstimado ? ` • ~${m.costeEstimado} €` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarMerma(m.id)}
                        className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
            {registrosMermas.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Vaciar el historial de mermas del turno?')) {
                    vaciarMermas();
                  }
                }}
                className="text-xs font-bold text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Vaciar historial
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppMermas}
                disabled={registrosMermas.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar WhatsApp a Chef</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
