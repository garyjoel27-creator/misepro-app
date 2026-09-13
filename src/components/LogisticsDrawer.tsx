import * as Dialog from '@radix-ui/react-dialog';
import { X, ClipboardCheck, Sparkles, CheckCircle2, XCircle, ShoppingBag } from 'lucide-react';
import { useBrigadeStore, type Compra } from '../store/useBrigadeStore';
import { AnimatePresence, motion } from 'framer-motion';

interface LogisticsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogisticsDrawer({ open, onOpenChange }: LogisticsDrawerProps) {
  const { comprasPendientes, vaciarCompras, sugerenciasIA, aceptarSugerencia, descartarSugerencia, analizandoIA } = useBrigadeStore();

  const handleExport = async () => {
    const vegetales = comprasPendientes.filter(c => c.categoria === 'Vegetales');
    const proteinas = comprasPendientes.filter(c => c.categoria === 'Proteinas');
    const lacteos = comprasPendientes.filter(c => c.categoria === 'Lacteos/Secos');

    let text = '*PEDIDO MISEPRO*\n\n';
    
    if (vegetales.length > 0) {
      text += '*🥦 VEGETALES*\n';
      vegetales.forEach(c => text += `- ${c.cantidad}x ${c.ingrediente}\n`);
      text += '\n';
    }
    
    if (proteinas.length > 0) {
      text += '*🥩 PROTEÍNAS*\n';
      proteinas.forEach(c => text += `- ${c.cantidad}x ${c.ingrediente}\n`);
      text += '\n';
    }
    
    if (lacteos.length > 0) {
      text += '*🥛 LÁCTEOS/SECOS*\n';
      lacteos.forEach(c => text += `- ${c.cantidad}x ${c.ingrediente}\n`);
      text += '\n';
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error('Fallback copy error', error);
          throw error;
        } finally {
          textArea.remove();
        }
      }
      vaciarCompras();
      onOpenChange(false);
      alert('Pedido exportado al portapapeles con éxito.');
    } catch (err) {
      console.error('Error al exportar: ', err);
      alert('Error al copiar al portapapeles');
    }
  };

  const CategorizedList = ({ title, items, icon }: { title: string, items: Compra[], icon: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-stone-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-xl">{icon}</span>
          {title}
        </h3>
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={item.id || i} className="flex justify-between items-center bg-stone-50 dark:bg-slate-950/60 p-3 rounded-xl border border-stone-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="font-bold text-stone-900 dark:text-slate-100 text-base">{item.ingrediente}</span>
              <span className="text-amber-700 dark:text-amber-400 font-black bg-amber-500/15 dark:bg-slate-900 px-3 py-1 rounded-lg text-sm border border-amber-500/30 dark:border-amber-500/20 shadow-xs">
                x{item.cantidad}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const vegetales = comprasPendientes.filter(c => c.categoria === 'Vegetales');
  const proteinas = comprasPendientes.filter(c => c.categoria === 'Proteinas');
  const lacteos = comprasPendientes.filter(c => c.categoria === 'Lacteos/Secos');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-lg"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-amber-900/10 dark:border-slate-800/80 z-50 flex flex-col shadow-2xl shadow-black/60"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-amber-500/40 flex justify-between items-center bg-stone-900 dark:bg-slate-950 text-white shadow-sm">
                  <div>
                    <Dialog.Title className="text-lg sm:text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-white">
                      <ShoppingBag className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                      Panel de Compras
                    </Dialog.Title>
                    <p className="text-[0.65rem] uppercase font-bold text-stone-400 dark:text-slate-400 tracking-wider mt-0.5">
                      Alertas de Stock & Reaprovisionamiento
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button 
                      className="min-h-[48px] min-w-[48px] rounded-xl border border-white/20 bg-white/10 hover:bg-red-500/80 hover:text-white transition-colors flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold cursor-pointer"
                      aria-label="Cerrar panel de compras"
                    >
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </Dialog.Close>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  {analizandoIA && (
                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-400/20 to-amber-500/10 dark:from-amber-400/15 dark:to-slate-900 border border-amber-500/40 rounded-2xl text-amber-900 dark:text-amber-300 backdrop-blur-md shadow-lg">
                      <Sparkles className="w-8 h-8 animate-spin mb-2 stroke-[2.5]" />
                      <p className="font-bold uppercase tracking-wider text-sm">Analizando Escandallo con IA...</p>
                      <span className="text-xs font-medium text-stone-600 dark:text-slate-400 mt-1">Calculando proyecciones de servicio</span>
                    </div>
                  )}

                  {!analizandoIA && sugerenciasIA.length > 0 && (
                    <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-md">
                      <h3 className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                        Sugerencias de la IA
                      </h3>
                      <div className="space-y-3">
                        {sugerenciasIA.map(sugerencia => (
                          <div key={sugerencia.id} className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-amber-500/20 dark:border-slate-800 shadow-sm flex flex-col gap-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-stone-900 dark:text-slate-100 text-base">{sugerencia.ingrediente}</span>
                                <span className="ml-2 text-amber-800 dark:text-amber-300 font-bold bg-amber-400/25 px-2 py-0.5 rounded-md text-xs border border-amber-500/30">
                                  +{sugerencia.cantidadSugerida}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => aceptarSugerencia(sugerencia.id)}
                                  className="min-h-[48px] min-w-[48px] flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl border border-emerald-500/40 shadow-sm transition-colors cursor-pointer"
                                  title="Aceptar sugerencia"
                                  aria-label="Aceptar sugerencia"
                                >
                                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => descartarSugerencia(sugerencia.id)}
                                  className="min-h-[48px] min-w-[48px] flex items-center justify-center bg-stone-200 hover:bg-red-500 hover:text-white active:bg-red-600 dark:bg-slate-800 dark:hover:bg-red-500 text-stone-700 dark:text-slate-300 rounded-xl border border-stone-300 dark:border-slate-700 shadow-sm transition-colors cursor-pointer"
                                  title="Descartar sugerencia"
                                  aria-label="Descartar sugerencia"
                                >
                                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-medium border-l-4 border-amber-400 pl-2.5 py-0.5">
                              {sugerencia.motivo}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {comprasPendientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-stone-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
                      <ClipboardCheck className="w-14 h-14 mb-3 text-stone-400 dark:text-slate-500 stroke-[1.5]" />
                      <p className="font-bold uppercase tracking-wide text-sm text-stone-900 dark:text-slate-100">No hay compras pendientes</p>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 font-medium">Usa el botón de compra en cualquier preparación para añadirla a la lista.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <CategorizedList title="Vegetales" items={vegetales} icon="🥦" />
                      <CategorizedList title="Proteínas" items={proteinas} icon="🥩" />
                      <CategorizedList title="Lácteos y Secos" items={lacteos} icon="🥛" />
                    </div>
                  )}
                </div>
                
                {/* Bottom Actions */}
                {comprasPendientes.length > 0 && (
                  <div className="p-4 sm:p-5 border-t border-stone-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
                    <button 
                      type="button"
                      onClick={handleExport}
                      className="min-h-[52px] w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white font-bold text-sm uppercase tracking-wider py-3 px-4 rounded-xl border border-emerald-400/30 shadow-lg shadow-emerald-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
                      Validar y Exportar Pedido
                    </button>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
