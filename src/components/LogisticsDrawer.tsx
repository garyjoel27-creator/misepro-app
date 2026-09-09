import * as Dialog from '@radix-ui/react-dialog';
import { X, ClipboardCheck, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
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
      // Even if copy fails, we might still want to clear, but the requirement says "copies ... and then empties"
      // If it fails, maybe we just alert.
      alert('Error al copiar al portapapeles');
    }
  };

  const CategorizedList = ({ title, items, icon }: { title: string, items: Compra[], icon: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={item.id || i} className="flex justify-between items-center text-sm text-slate-700 bg-white p-2 rounded shadow-sm">
              <span className="font-medium">{item.ingrediente}</span>
              <span className="text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">x{item.cantidad}</span>
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
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/40 z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              >
                <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
                  <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                    Panel de Compras y Alertas
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-slate-400 hover:text-white transition-colors focus:outline-none rounded p-1 focus:ring-2 focus:ring-slate-300">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {analizandoIA && (
                    <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600">
                      <Sparkles className="w-8 h-8 animate-pulse mb-3" />
                      <p className="font-semibold text-sm">Analizando escandallo con IA...</p>
                    </div>
                  )}

                  {!analizandoIA && sugerenciasIA.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Sugerencias de IA
                      </h3>
                      <div className="space-y-3">
                        {sugerenciasIA.map(sugerencia => (
                          <div key={sugerencia.id} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-slate-800">{sugerencia.ingrediente}</span>
                                <span className="ml-2 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded text-sm">x{sugerencia.cantidadSugerida}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => aceptarSugerencia(sugerencia.id)}
                                  className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors"
                                  title="Aceptar sugerencia"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => descartarSugerencia(sugerencia.id)}
                                  className="text-slate-400 hover:bg-slate-100 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Descartar"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-indigo-200 pl-2">
                              {sugerencia.motivo}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {comprasPendientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <ClipboardCheck className="w-16 h-16 mb-4 opacity-50" />
                      <p>No hay compras pendientes</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      <CategorizedList title="Vegetales" items={vegetales} icon="🥦" />
                      <CategorizedList title="Proteínas" items={proteinas} icon="🥩" />
                      <CategorizedList title="Lácteos y Secos" items={lacteos} icon="🥛" />
                    </div>
                  )}
                </div>
                
                {comprasPendientes.length > 0 && (
                  <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
                    <button 
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      <ClipboardCheck className="w-5 h-5" />
                      Validar y Exportar Portapapeles
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
