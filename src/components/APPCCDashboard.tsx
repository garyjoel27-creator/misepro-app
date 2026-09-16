import { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Printer, 
  Calendar, 
  User, 
  Thermometer, 
  RotateCcw, 
  Check, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Flame,
  Snowflake,
  Refrigerator,
  Utensils
} from 'lucide-react';
import { 
  useBrigadeStore, 
  type PuntoControlAPPCC, 
  type MedicionAPPCC 
} from '../store/useBrigadeStore';
import { useTheme } from '../hooks/useTheme';
import { APPCCReportModal } from './APPCCReportModal';

const MEDIDAS_CORRECTORAS_SUGERIDAS = [
  'Regulado termostato del equipo',
  'Cierre de puerta/burletes comprobado',
  'Avisado servicio técnico de frío',
  'Trasladado producto vulnerable a otra cámara',
  'Aceite sustituido y filtrado',
  'Ciclo de lavado térmico repetido',
  'Desescarche manual realizado'
];

export function APPCCDashboard() {
  const { isDark } = useTheme();
  const { 
    puntosControlAPPCC, 
    registrosAPPCC, 
    datosEstablecimientoAPPCC,
    registrarLecturaAPPCC,
    eliminarRegistroAPPCC
  } = useBrigadeStore();

  const [showReportModal, setShowReportModal] = useState(false);
  
  // Datos del turno actual
  const [turno, setTurno] = useState<'Mañana' | 'Tarde'>(() => {
    const hora = new Date().getHours();
    return hora < 16 ? 'Mañana' : 'Tarde';
  });
  
  const [responsable, setResponsable] = useState(datosEstablecimientoAPPCC.responsable || 'Jefe de Cocina');

  // Estado local de temperaturas a registrar (inicializado con las temperaturas ideales)
  const [valoresLocales, setValoresLocales] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    puntosControlAPPCC.forEach(p => {
      initial[p.id] = p.tempIdeal;
    });
    return initial;
  });

  // Acciones correctoras seleccionadas para puntos fuera de rango
  const [accionesCorrectoras, setAccionesCorrectoras] = useState<Record<string, string>>({});

  // Expandir registros del historial
  const [registroExpandidoId, setRegistroExpandidoId] = useState<string | null>(null);

  // Comprobar si un valor está dentro del rango legal
  const esConforme = (punto: PuntoControlAPPCC, valor: number) => {
    return valor >= punto.tempMinLegal && valor <= punto.tempMaxLegal;
  };

  const handleDelta = (puntoId: string, delta: number) => {
    setValoresLocales(prev => ({
      ...prev,
      [puntoId]: Math.round(((prev[puntoId] ?? 0) + delta) * 10) / 10
    }));
  };

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (_) {}

    if ('vibrate' in navigator) {
      navigator.vibrate([60, 40, 80]);
    }
  };

  // Botón Rápido 1-Tap: Registrar Todo Conforme
  const handleRegistrarTodoConforme = () => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const mediciones: MedicionAPPCC[] = puntosControlAPPCC.map(p => ({
      puntoId: p.id,
      nombrePunto: p.nombre,
      valor: p.tempIdeal,
      conforme: true
    }));

    registrarLecturaAPPCC({
      fecha,
      hora,
      turno,
      responsable: responsable.trim() || 'Jefe de Cocina',
      mediciones,
      incidenciaDetectada: false
    });

    playSuccessChime();
    alert(`✅ Registro oficial de ${turno} guardado con éxito y sellado para Sanidad.`);
  };

  // Guardar registro manual con las temperaturas actuales en pantalla
  const handleGuardarManual = (e: React.FormEvent) => {
    e.preventDefault();
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let hayIncidencia = false;
    const mediciones: MedicionAPPCC[] = puntosControlAPPCC.map(p => {
      const valor = valoresLocales[p.id] ?? p.tempIdeal;
      const conforme = esConforme(p, valor);
      if (!conforme) hayIncidencia = true;

      return {
        puntoId: p.id,
        nombrePunto: p.nombre,
        valor,
        conforme,
        accionCorrectora: !conforme ? (accionesCorrectoras[p.id] || 'Revisado y estabilizado') : undefined
      };
    });

    registrarLecturaAPPCC({
      fecha,
      hora,
      turno,
      responsable: responsable.trim() || 'Jefe de Cocina',
      mediciones,
      incidenciaDetectada: hayIncidencia
    });

    playSuccessChime();
    alert(`🛡️ Registro sanitario de ${turno} archivado en el sistema.`);
  };

  const getPuntoIcon = (tipo: PuntoControlAPPCC['tipo']) => {
    switch (tipo) {
      case 'camara': return <Refrigerator className="w-5 h-5 text-cyan-400" />;
      case 'congelador': return <Snowflake className="w-5 h-5 text-blue-400" />;
      case 'aceite': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'lavavajillas': return <Utensils className="w-5 h-5 text-teal-400" />;
      default: return <Thermometer className="w-5 h-5 text-emerald-400" />;
    }
  };

  // Comprobar si hoy ya se tomó registro de mañana y de tarde
  const hoyStr = new Date().toISOString().split('T')[0];
  const registrosHoy = registrosAPPCC.filter(r => r.fecha === hoyStr);
  const mananaRegistrada = registrosHoy.some(r => r.turno === 'Mañana');
  const tardeRegistrada = registrosHoy.some(r => r.turno === 'Tarde');

  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-20 animate-in fade-in duration-300">
      
      {/* Banner Principal de Mando Sanitario */}
      <div className={`w-full p-4 sm:p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border-emerald-500/30 shadow-black/40' 
          : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-200 shadow-stone-900/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0 font-bold">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-emerald-700 dark:text-emerald-400">
                Sistema Blindado APPCC / Sanidad
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-slate-300 mt-0.5">
              Autocontrol diario de temperaturas con sellado inmutable para auditorías sanitarias.
            </p>
          </div>
        </div>

        {/* Acceso directo a Dossier A4 e Indicadores de Turno */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
          <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
            isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-stone-200 shadow-sm'
          }`}>
            <span className="text-[10px] uppercase font-bold text-stone-500">Hoy:</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
              mananaRegistrada ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-stone-200 dark:bg-slate-800 text-stone-400'
            }`}>
              ☀️ Mañana {mananaRegistrada ? '✓' : '...'}
            </span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
              tardeRegistrada ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-stone-200 dark:bg-slate-800 text-stone-400'
            }`}>
              🌙 Tarde {tardeRegistrada ? '✓' : '...'}
            </span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Dossier Oficial A4</span>
          </button>
        </div>
      </div>

      {/* ZONA DE TOMA DE LECTURA (1-TAP Y FORMULARIO ERGONÓMICO) */}
      <section className={`p-4 sm:p-6 rounded-3xl border shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-stone-200'
      }`}>
        
        {/* Cabecera del formulario de toma */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <Thermometer className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-wider">
                Nueva Toma de Temperaturas
              </h3>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                Selecciona el turno y valida en 1-tap o ajusta cámaras individualmente.
              </span>
            </div>
          </div>

          {/* Selector de Turno y Responsable */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-1 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTurno('Mañana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  turno === 'Mañana'
                    ? 'bg-amber-400 text-amber-950 shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                }`}
              >
                ☀️ Mañana
              </button>
              <button
                type="button"
                onClick={() => setTurno('Tarde')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  turno === 'Tarde'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                }`}
              >
                🌙 Tarde
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-bold">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Responsable..."
                className="w-32 bg-transparent focus:outline-none text-stone-900 dark:text-white text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* BOTÓN PROMINENTE 1-TAP (SALVAGUARDA RÁPIDA) */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                ¿Todo en orden en la cocina?
              </h4>
              <p className="text-xs text-stone-600 dark:text-slate-300">
                Sella instantáneamente el turno de {turno} con todas las cámaras en sus valores legales recomendados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegistrarTodoConforme}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>Registrar Todo Conforme (1-Tap)</span>
          </button>
        </div>

        {/* PARRILLA DE CÁMARAS Y PUNTOS DE CONTROL CON STEPPERS [-] [+] */}
        <form onSubmit={handleGuardarManual} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {puntosControlAPPCC.map(punto => {
              const valor = valoresLocales[punto.id] ?? punto.tempIdeal;
              const conforme = esConforme(punto, valor);

              return (
                <div
                  key={punto.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    conforme
                      ? isDark 
                        ? 'bg-slate-950/60 border-slate-800' 
                        : 'bg-stone-50 border-stone-200'
                      : 'bg-red-500/10 border-red-500/50 shadow-md shadow-red-950/20'
                  }`}
                >
                  {/* Título y Rango Legal */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm">
                        {getPuntoIcon(punto.tipo)}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight">
                          {punto.nombre}
                        </h5>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono font-medium">
                          Legal: {punto.tempMinLegal}º a {punto.tempMaxLegal} {punto.unidad}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Conformidad */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      conforme
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {conforme ? 'OK' : 'DESVIACIÓN'}
                    </span>
                  </div>

                  {/* Stepper de Temperatura */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelta(punto.id, -0.5)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer font-bold shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className={`min-w-[70px] text-center font-mono font-black text-2xl tracking-tighter ${
                        conforme 
                          ? 'text-stone-900 dark:text-white' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {valor} {punto.unidad}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelta(punto.id, 0.5)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-300 dark:border-slate-700 text-stone-900 dark:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer font-bold shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setValoresLocales(prev => ({ ...prev, [punto.id]: punto.tempIdeal }))}
                      className="text-[10px] text-stone-400 hover:text-amber-500 flex items-center gap-0.5 cursor-pointer font-bold"
                      title="Restablecer temperatura ideal"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Ideal</span>
                    </button>
                  </div>

                  {/* Desplegable de Medida Correctora si está fuera de rango legal */}
                  {!conforme && (
                    <div className="mt-2 pt-2 border-t border-red-500/20 flex flex-col gap-1 text-left">
                      <span className="text-[10px] uppercase font-black text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Medida Correctora Obligatoria:
                      </span>
                      <select
                        value={accionesCorrectoras[punto.id] || ''}
                        onChange={(e) => setAccionesCorrectoras(prev => ({ ...prev, [punto.id]: e.target.value }))}
                        className="w-full text-xs font-semibold p-2 rounded-xl bg-white dark:bg-slate-900 border border-red-500/40 text-stone-900 dark:text-white focus:outline-none"
                        required
                      >
                        <option value="">Selecciona acción para Sanidad...</option>
                        {MEDIDAS_CORRECTORAS_SUGERIDAS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón de Guardado con temperaturas personalizadas */}
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="min-h-[48px] px-8 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Registro Personalizado ({turno})</span>
            </button>
          </div>
        </form>
      </section>

      {/* HISTORIAL RECIENTE DE AUDITORÍA */}
      <section className={`p-4 sm:p-6 rounded-3xl border shadow-lg ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-wider">
              Historial de Auditoría ({registrosAPPCC.length})
            </h3>
          </div>

          <span className="text-xs text-stone-400 font-medium">
            Últimos 30 días registrados
          </span>
        </div>

        {registrosAPPCC.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
            <p className="text-sm font-bold">Sin registros previos.</p>
            <p className="text-xs text-stone-500 mt-1">Usa el botón de toma superior para iniciar tu histórico sanitario.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrosAPPCC.map(reg => {
              const isExpanded = registroExpandidoId === reg.id;

              return (
                <div
                  key={reg.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    reg.incidenciaDetectada
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isDark
                        ? 'bg-slate-950/40 border-slate-800'
                        : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        reg.incidenciaDetectada 
                          ? 'bg-amber-500/20 text-amber-500' 
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {reg.turno === 'Mañana' ? '☀️' : '🌙'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-stone-900 dark:text-white">
                            {reg.fecha}
                          </span>
                          <span className="text-xs text-stone-400 font-medium font-mono">
                            {reg.hora}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                            Turno {reg.turno}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 dark:text-slate-400">
                          Responsable: <strong>{reg.responsable}</strong> • {reg.mediciones.length} puntos controlados
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        reg.incidenciaDetectada
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {reg.incidenciaDetectada ? '⚠️ Incidencia Solventada' : '✅ 100% Conforme'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setRegistroExpandidoId(isExpanded ? null : reg.id)}
                        className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-500 cursor-pointer"
                        title="Ver detalle"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar registro de auditoría del ${reg.fecha} (${reg.turno})?`)) {
                            eliminarRegistroAPPCC(reg.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-500 cursor-pointer transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detalle expandido de las mediciones de esa toma */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-stone-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {reg.mediciones.map(med => (
                        <div key={med.puntoId} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col">
                          <span className="text-[10px] text-stone-500 font-bold truncate">{med.nombrePunto}</span>
                          <span className={`font-mono font-black text-sm ${med.conforme ? 'text-stone-900 dark:text-white' : 'text-red-600'}`}>
                            {med.valor}º
                          </span>
                          {med.accionCorrectora && (
                            <span className="text-[9px] text-red-600 dark:text-red-400 mt-0.5">
                              ↳ {med.accionCorrectora}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL INFORME OFICIAL A4 IMPRIMIBLE */}
      <APPCCReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

    </div>
  );
}
