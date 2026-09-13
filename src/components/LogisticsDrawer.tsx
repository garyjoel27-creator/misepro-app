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
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-900">
        <h3 className="font-black text-slate-950 uppercase tracking-wider mb-3 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-xl">{icon}</span>
          {title}
        </h3>
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={item.id || i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border-2 border-slate-900">
              <span className="font-black text-slate-950 text-base">{item.ingrediente}</span>
              <span className="text-amber-400 font-black bg-slate-950 px-3 py-1 rounded-lg text-sm border-2 border-slate-900">
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
                className="fixed inset-0 bg-slate-950/70 z-50 backdrop-blur-xs"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-100 border-l-4 border-slate-900 z-50 flex flex-col shadow-none"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b-4 border-amber-500 flex justify-between items-center bg-slate-950 text-white">
                  <div>
                    <Dialog.Title className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                      Panel de Compras
                    </Dialog.Title>
                    <p className="text-[0.65rem] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                      Alertas de Stock & Reaprovisionamiento
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button 
                      className="min-h-[44px] min-w-[44px] rounded-xl border-2 border-slate-900 bg-slate-800 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-black"
                      aria-label="Cerrar panel de compras"
                    >
                      <X className="w-5 h-5 stroke-[3]" />
                    </button>
                  </Dialog.Close>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  {analizandoIA && (
                    <div className="flex flex-col items-center justify-center p-6 bg-amber-400 border-2 border-slate-900 rounded-2xl text-slate-950">
                      <Sparkles className="w-8 h-8 animate-spin mb-2 stroke-[2.5]" />
                      <p className="font-black uppercase tracking-wider text-sm">Analizando Escandallo con IA...</p>
                      <span className="text-xs font-bold text-slate-900 mt-1">Calculando proyecciones de servicio</span>
                    </div>
                  )}

                  {!analizandoIA && sugerenciasIA.length > 0 && (
                    <div className="bg-amber-100 border-2 border-slate-900 rounded-2xl p-4 sm:p-5">
                      <h3 className="font-black text-slate-950 uppercase tracking-wider mb-3 flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                        Sugerencias de la IA
                      </h3>
                      <div className="space-y-3">
                        {sugerenciasIA.map(sugerencia => (
                          <div key={sugerencia.id} className="bg-white p-4 rounded-xl border-2 border-slate-900 flex flex-col gap-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-black text-slate-950 text-base">{sugerencia.ingrediente}</span>
                                <span className="ml-2 text-slate-950 font-black bg-amber-400 px-2 py-0.5 rounded-md text-xs border border-slate-900">
                                  +{sugerencia.cantidadSugerida}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => aceptarSugerencia(sugerencia.id)}
                                  className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl border-2 border-slate-900 transition-colors"
                                  title="Aceptar sugerencia"
                                  aria-label="Aceptar sugerencia"
                                >
                                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => descartarSugerencia(sugerencia.id)}
                                  className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-200 hover:bg-red-500 hover:text-white text-slate-800 rounded-xl border-2 border-slate-900 transition-colors"
                                  title="Descartar sugerencia"
                                  aria-label="Descartar sugerencia"
                                >
                                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-semibold border-l-4 border-amber-400 pl-2.5 py-0.5">
                              {sugerencia.motivo}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {comprasPendientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white border-2 border-slate-900 rounded-2xl">
                      <ClipboardCheck className="w-14 h-14 mb-3 text-slate-400 stroke-[1.5]" />
                      <p className="font-black uppercase tracking-wide text-sm text-slate-950">No hay compras pendientes</p>
                      <p className="text-xs text-slate-600 mt-1 font-bold">Usa el botón de compra en cualquier preparación para añadirla a la lista.</p>
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
                  <div className="p-4 sm:p-5 border-t-2 border-slate-900 bg-white">
                    <button 
                      type="button"
                      onClick={handleExport}
                      className="min-h-[52px] w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider py-3 px-4 rounded-xl border-2 border-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
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
