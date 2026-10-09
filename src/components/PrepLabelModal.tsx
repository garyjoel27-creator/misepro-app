import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Tag, X, Printer, Copy, Check } from 'lucide-react';
import { useBrigadeStore, type Tarea } from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';

export interface PrepLabelModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  tareaInicial?: Tarea | null;
  initialData?: {
    producto?: string;
    partida?: string;
    responsable?: string;
  } | null;
}

const ALERGENOS_COMUNES = [
  'Gluten', 'Lácteos', 'Huevos', 'Pescado', 'Crustáceos', 'Moluscos', 
  'Frutos de cáscara', 'Soja', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos'
];

export function PrepLabelModal({ 
  open, 
  isOpen, 
  onOpenChange, 
  onClose, 
  tareaInicial, 
  initialData 
}: PrepLabelModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const { isDark } = useTheme();
  const { partidas, nombreRestaurante, guardarEtiquetaCaducidad } = useBrigadeStore();

  const [nombre, setNombre] = useState('');
  const [partida, setPartida] = useState(partidas[0] || 'Cocina');
  const [cantidad, setCantidad] = useState<number | undefined>(undefined);
  const [unidad, setUnidad] = useState('Kg');
  const [tipoConservacion, setTipoConservacion] = useState<'Refrigerado (<3ºC)' | 'Congelado (<-18ºC)' | 'Seco/Ambiente'>('Refrigerado (<3ºC)');
  const [diasCaducidad, setDiasCaducidad] = useState(3);
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [responsable, setResponsable] = useState('Cocinero Partida');
  const [lote, setLote] = useState('');
  const [alergenosSeleccionados, setAlergenosSeleccionados] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [guardadoFeedback, setGuardadoFeedback] = useState(false);

  // Inicializar campos cuando se abre con una tarea o datos iniciales
  React.useEffect(() => {
    if (isModalOpen) {
      const now = new Date();
      if (tareaInicial) {
        setNombre(tareaInicial.nombre);
        setPartida(tareaInicial.partida || partidas[0] || 'Cocina');
        setCantidad(tareaInicial.cantidad);
        setUnidad(tareaInicial.unidad || 'Kg');
      } else if (initialData) {
        if (initialData.producto) setNombre(initialData.producto);
        if (initialData.partida) setPartida(initialData.partida);
        if (initialData.responsable) setResponsable(initialData.responsable);
      } else if (!nombre) {
        setPartida(partidas[0] || 'Cocina');
      }

      // Fecha caducidad por defecto (+3 días)
      const cad = new Date(now.getTime() + diasCaducidad * 24 * 60 * 60 * 1000);
      setFechaCaducidad(cad.toISOString().split('T')[0]);
      setLote(`L-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`);
      setGuardadoFeedback(false);
    }
  }, [isModalOpen, tareaInicial, initialData]);

  const aplicarPresetDias = (dias: number, conservacion?: 'Refrigerado (<3ºC)' | 'Congelado (<-18ºC)' | 'Seco/Ambiente') => {
    setDiasCaducidad(dias);
    const now = new Date();
    const cad = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);
    setFechaCaducidad(cad.toISOString().split('T')[0]);
    if (conservacion) {
      setTipoConservacion(conservacion);
    }
  };

  const toggleAlergeno = (al: string) => {
    setAlergenosSeleccionados(prev => 
      prev.includes(al) ? prev.filter(x => x !== al) : [...prev, al]
    );
  };

  const fechaElaboracionTexto = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleGuardar = () => {
    if (!nombre.trim()) return;
    guardarEtiquetaCaducidad({
      nombre: nombre.trim(),
      partida,
      cantidad,
      unidad,
      fechaElaboracion: fechaElaboracionTexto,
      fechaCaducidad: fechaCaducidad || new Date().toISOString().split('T')[0],
      horaCaducidad: '23:59',
      tipoConservacion,
      alergenos: alergenosSeleccionados,
      responsable: responsable.trim() || 'Brigada',
      lote: lote.trim() || undefined
    });
    setGuardadoFeedback(true);
    setTimeout(() => {
      setGuardadoFeedback(false);
      handleClose();
    }, 600);
  };

  const handleCopiarFicha = () => {
    const texto = `🏷️ ETIQUETA APPCC - ${nombreRestaurante}
Producto: ${nombre}
Partida: ${partida}
${cantidad ? `Cantidad: ${cantidad} ${unidad}\n` : ''}Elaborado: ${fechaElaboracionTexto}
CADUCIDAD: ${fechaCaducidad}
Conservación: ${tipoConservacion}
Responsable: ${responsable}
${lote ? `Lote: ${lote}\n` : ''}${alergenosSeleccionados.length > 0 ? `Alérgenos: ${alergenosSeleccionados.join(', ')}\n` : 'Alérgenos: Ninguno declarado'}`;

    try {
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
        <Dialog.Content className={`fixed inset-x-3 sm:inset-x-auto top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-50 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl p-4 sm:p-6 overflow-y-auto ${
          isDark 
            ? 'bg-[#0f1422] border-amber-500/30 text-white' 
            : 'bg-white border-stone-300 text-stone-900'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black">
                <Tag className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-serif font-black tracking-wide text-amber-500 dark:text-amber-400">
                  Etiqueta de Caducidad y Marcado
                </Dialog.Title>
                <Dialog.Description className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  Cumplimiento APPCC Sanitario • Rotulado Secundario
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
            {/* Formulario rápido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  Nombre de la Elaboración / Alimento:
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Fondo Oscuro, Tartar Aliñado, Cebolla Brunoise..."
                  className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-sm bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  Partida:
                </label>
                <select
                  value={partida}
                  onChange={(e) => setPartida(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-xs bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700"
                >
                  {partidas.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  Responsable / Cocinero:
                </label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-semibold text-xs bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Presets Rápidos de Caducidad Sanitaria */}
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block mb-1.5">
                ⚡ Presets Rápidos de Caducidad Secundaria (1 Toque):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => aplicarPresetDias(1, 'Refrigerado (<3ºC)')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    diasCaducidad === 1 ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  +24h (Pescados / Crudos)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetDias(2, 'Refrigerado (<3ºC)')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    diasCaducidad === 2 ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  +48h (Carnes / Cocinados)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetDias(3, 'Refrigerado (<3ºC)')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    diasCaducidad === 3 ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  +72h (Salsas / Caldos)
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPresetDias(30, 'Congelado (<-18ºC)')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    diasCaducidad === 30 ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  +30 Días (Congelador)
                </button>
              </div>
            </div>

            {/* Fecha y Conservación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  Fecha Límite de Consumo:
                </label>
                <input
                  type="date"
                  value={fechaCaducidad}
                  onChange={(e) => setFechaCaducidad(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-xs bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  Conservación:
                </label>
                <select
                  value={tipoConservacion}
                  onChange={(e) => setTipoConservacion(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-xs bg-stone-50 dark:bg-slate-900 border-stone-300 dark:border-slate-700"
                >
                  <option value="Refrigerado (<3ºC)">Refrigerado (&lt; 3ºC)</option>
                  <option value="Congelado (<-18ºC)">Congelado (&lt; -18ºC)</option>
                  <option value="Seco/Ambiente">Seco / Ambiente</option>
                </select>
              </div>
            </div>

            {/* Selector de Alérgenos */}
            <div>
              <span className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                Alérgenos Presentes:
              </span>
              <div className="flex flex-wrap gap-1">
                {ALERGENOS_COMUNES.map(al => {
                  const sel = alergenosSeleccionados.includes(al);
                  return (
                    <button
                      key={al}
                      type="button"
                      onClick={() => toggleAlergeno(al)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        sel 
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 ring-1 ring-red-500/30' 
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-slate-400 border-stone-300 dark:border-stone-700'
                      }`}
                    >
                      {sel ? '⚠️ ' : ''}{al}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VISTA PREVIA: CINTA DE CARROCERO / ETIQUETA TÉRMICA */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#181a13] border-2 border-dashed border-amber-500/50 text-stone-900 dark:text-amber-100 font-mono shadow-inner">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5 mb-2">
                <span className="font-black text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {nombreRestaurante || 'COCINA CENTRAL'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tight bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">
                  {partida}
                </span>
              </div>

              <div className="text-base sm:text-lg font-black uppercase tracking-tight py-1">
                {nombre || 'NOMBRE DE ELABORACIÓN'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-t border-b border-amber-500/20">
                <div>
                  <span className="text-[10px] uppercase text-stone-500 dark:text-amber-300/60 block">Elaborado:</span>
                  <span className="font-bold">{fechaElaboracionTexto}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-red-500 font-bold block">CADUCIDAD:</span>
                  <span className="font-black text-sm text-red-600 dark:text-red-400">{fechaCaducidad || 'DD/MM/AAAA'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5">
                <span>{tipoConservacion}</span>
                <span>Resp: <strong>{responsable}</strong></span>
              </div>

              {alergenosSeleccionados.length > 0 && (
                <div className="mt-2 text-[10px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 px-2 py-1 rounded">
                  ⚠️ ALÉRGENOS: {alergenosSeleccionados.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarFicha}
                className="px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                title="Copiar texto de etiqueta"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                title="Imprimir en impresora térmica o ticket"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                <span>Imprimir</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={!nombre.trim()}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 ${
                guardadoFeedback
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 disabled:opacity-40'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{guardadoFeedback ? 'Guardado en Registro' : 'Guardar Etiqueta'}</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
