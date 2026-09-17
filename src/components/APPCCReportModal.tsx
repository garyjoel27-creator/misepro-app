import { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Check, 
  ShieldCheck, 
  Calendar, 
  FileText 
} from 'lucide-react';
import { useBrigadeStore } from '../store/useBrigadeStore';

interface APPCCReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function APPCCReportModal({ isOpen, onClose }: APPCCReportModalProps) {
  const { 
    registrosAPPCC, 
    puntosControlAPPCC, 
    datosEstablecimientoAPPCC,
    actualizarDatosEstablecimientoAPPCC 
  } = useBrigadeStore();

  const [mesFiltro, setMesFiltro] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [nombreLocal, setNombreLocal] = useState(datosEstablecimientoAPPCC.nombre);
  const [cifLocal, setCifLocal] = useState(datosEstablecimientoAPPCC.cif);
  const [responsableLocal, setResponsableLocal] = useState(datosEstablecimientoAPPCC.responsable);
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filtrar registros por el mes seleccionado
  const registrosFiltrados = registrosAPPCC.filter(r => r.fecha.startsWith(mesFiltro));
  const totalLecturas = registrosFiltrados.length;
  const totalIncidencias = registrosFiltrados.filter(r => r.incidenciaDetectada).length;
  const porcentajeConformidad = totalLecturas > 0 
    ? Math.round(((totalLecturas - totalIncidencias) / totalLecturas) * 100) 
    : 100;

  const handleGuardarDatos = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarDatosEstablecimientoAPPCC({
      nombre: nombreLocal.trim() || 'Mi Restaurante',
      cif: cifLocal.trim() || 'B-00000000',
      responsable: responsableLocal.trim() || 'Jefe de Cocina'
    });
    setEditandoDatos(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros en el mes seleccionado para exportar.');
      return;
    }

    const pccHeaders = puntosControlAPPCC.map(p => 
      `<th style="border: 1px solid #444; padding: 6px 4px; background-color: #f1f5f9; font-size: 8.5pt; text-align: center;">
        ${p.nombre}<br>
        <span style="font-size: 7pt; font-weight: normal; color: #475569;">(${p.tempMinLegal} a ${p.tempMaxLegal}${p.unidad})</span>
      </th>`
    ).join('');

    const rowsHtml = registrosFiltrados.map(r => {
      const pccCells = puntosControlAPPCC.map(p => {
        const med = r.mediciones.find(m => m.puntoId === p.id);
        if (!med) return '<td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt; color: #94a3b8;">-</td>';
        const out = med.valor < p.tempMinLegal || med.valor > p.tempMaxLegal;
        return `<td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt; ${out ? 'color: #b91c1c; font-weight: bold; background-color: #fee2e2;' : 'color: #0f172a;'}">${med.valor}º</td>`;
      }).join('');

      const acciones = r.mediciones
        .filter(m => m.accionCorrectora)
        .map(m => `<b>${m.nombrePunto}:</b> ${m.accionCorrectora}`)
        .join('<br>') || 'Conforme';

      return `<tr>
        <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt; font-family: monospace;">${r.fecha}</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt; font-family: monospace;">${r.hora}</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt;">${r.turno}</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; font-weight: 600;">${r.responsable}</td>
        ${pccCells}
        <td style="border: 1px solid #cbd5e1; padding: 5px; text-align: center; font-size: 8.5pt; font-weight: bold; color: ${r.incidenciaDetectada ? '#b91c1c' : '#047857'}; background-color: ${r.incidenciaDetectada ? '#fee2e2' : '#ecfdf5'};">
          ${r.incidenciaDetectada ? 'NO CONFORME' : 'CONFORME'}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8pt; color: ${r.incidenciaDetectada ? '#991b1b' : '#64748b'};">${acciones}</td>
      </tr>`;
    }).join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Auditoría Sanitaria APPCC - ${mesFiltro}</title>
        <style>
          @page {
            size: landscape;
            margin: 1.5cm;
          }
          body { 
            font-family: Arial, Calibri, sans-serif; 
            margin: 0; 
            color: #0f172a;
          }
          .header-box {
            border: 2px solid #0f172a;
            padding: 14px 18px;
            margin-bottom: 18px;
            background-color: #f8fafc;
          }
          h1 { 
            font-size: 15pt; 
            color: #0f172a; 
            text-transform: uppercase; 
            margin: 0 0 4px 0; 
            text-align: center; 
            letter-spacing: 0.5px;
          }
          .subtitle { 
            font-size: 9.5pt; 
            color: #475569; 
            text-align: center; 
            margin: 0 0 12px 0; 
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 16px; 
          }
          .meta-table td { 
            padding: 5px 8px; 
            border: 1px solid #cbd5e1; 
            font-size: 9pt; 
          }
          .pcc-table th { 
            background-color: #e2e8f0; 
            color: #0f172a; 
          }
          .signatures-table { 
            margin-top: 35px; 
            width: 100%; 
            border: none;
          }
          .signatures-table td { 
            border: none; 
            padding: 10px 25px; 
            text-align: center; 
            font-size: 9.5pt; 
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>SISTEMA DE AUTOCONTROL HIGIÉNICO-SANITARIO (APPCC)</h1>
          <div class="subtitle">Hoja Oficial de Registro de Temperaturas, Desviaciones y Medidas Correctoras • Reglamento (CE) 852/2004 & Real Decreto 1021/2022</div>
          
          <table class="meta-table">
            <tr>
              <td style="width: 50%;"><b>Establecimiento / Razón Social:</b> ${datosEstablecimientoAPPCC.nombre}</td>
              <td style="width: 50%;"><b>CIF / NIF Sanitario:</b> ${datosEstablecimientoAPPCC.cif}</td>
            </tr>
            <tr>
              <td><b>Responsable Técnico Sanitario:</b> ${datosEstablecimientoAPPCC.responsable}</td>
              <td><b>Mes de Control Auditado:</b> ${mesFiltro}</td>
            </tr>
          </table>
        </div>

        <h2 style="font-size: 10.5pt; text-transform: uppercase; margin: 12px 0 6px 0; color: #0f172a;">
          1. Registro de Puntos de Control Crítico (PCC)
        </h2>
        <table class="pcc-table">
          <thead>
            <tr>
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Fecha</th>
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Hora</th>
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Turno</th>
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Responsable</th>
              ${pccHeaders}
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Dictamen</th>
              <th style="border: 1px solid #444; padding: 6px; font-size: 8.5pt;">Medidas Correctoras</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <h2 style="font-size: 10.5pt; text-transform: uppercase; margin: 16px 0 6px 0; color: #0f172a;">
          2. Resumen y Conformidad Sanitaria
        </h2>
        <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #f8fafc; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; font-size: 9pt; width: 33%;"><b>Total de Controles Realizados:</b> ${totalLecturas}</td>
            <td style="padding: 10px; font-size: 9pt; width: 33%;"><b>Tasa de Conformidad:</b> ${porcentajeConformidad}%</td>
            <td style="padding: 10px; font-size: 9pt; width: 33%;"><b>Incidencias Subsanadas:</b> ${totalIncidencias}</td>
          </tr>
        </table>

        <table class="signatures-table">
          <tr>
            <td style="width: 50%;">
              <br><br>
              ____________________________________________<br>
              <b>Firma del Responsable del Establecimiento</b><br>
              <span style="font-size: 8pt; color: #64748b;">Fecha de emisión y sellado oficial</span>
            </td>
            <td style="width: 50%;">
              <br><br>
              ____________________________________________<br>
              <b>Firma del Inspector / Auditor Sanitario</b><br>
              <span style="font-size: 8pt; color: #64748b;">Revisado conforme al R.D. 1021/2022</span>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_APPCC_${mesFiltro}_${datosEstablecimientoAPPCC.nombre.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros en el mes seleccionado para exportar.');
      return;
    }

    const pccHeaders = puntosControlAPPCC.map(p => 
      `<th style="background-color: #e2e8f0; font-weight: bold; border: 1px solid #000; text-align: center;">${p.nombre} (${p.tempMinLegal} a ${p.tempMaxLegal}${p.unidad})</th>`
    ).join('');

    const rowsHtml = registrosFiltrados.map(r => {
      const pccCells = puntosControlAPPCC.map(p => {
        const med = r.mediciones.find(m => m.puntoId === p.id);
        if (!med) return '<td style="border: 1px solid #ccc; text-align: center;">-</td>';
        const out = med.valor < p.tempMinLegal || med.valor > p.tempMaxLegal;
        return `<td style="border: 1px solid #ccc; text-align: center; ${out ? 'color: red; font-weight: bold; background-color: #fee2e2;' : ''}">${med.valor}º</td>`;
      }).join('');

      const acciones = r.mediciones
        .filter(m => m.accionCorrectora)
        .map(m => `${m.nombrePunto}: ${m.accionCorrectora}`)
        .join(' | ') || 'Ninguna';

      return `<tr>
        <td style="border: 1px solid #ccc; text-align: center;">${r.fecha}</td>
        <td style="border: 1px solid #ccc; text-align: center;">${r.hora}</td>
        <td style="border: 1px solid #ccc; text-align: center;">${r.turno}</td>
        <td style="border: 1px solid #ccc;">${r.responsable}</td>
        ${pccCells}
        <td style="border: 1px solid #ccc; font-weight: bold; text-align: center; color: ${r.incidenciaDetectada ? 'red' : 'green'};">${r.incidenciaDetectada ? 'NO CONFORME' : 'CONFORME'}</td>
        <td style="border: 1px solid #ccc;">${acciones}</td>
      </tr>`;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <table>
          <tr><th colspan="7" style="font-size: 16pt; font-weight: bold; text-align: left;">SISTEMA DE AUTOCONTROL HIGIÉNICO-SANITARIO (APPCC)</th></tr>
          <tr><td colspan="7" style="color: #666;">Establecimiento: ${datosEstablecimientoAPPCC.nombre} | CIF: ${datosEstablecimientoAPPCC.cif} | Responsable: ${datosEstablecimientoAPPCC.responsable} | Mes: ${mesFiltro}</td></tr>
          <tr><td colspan="7"></td></tr>
          <tr>
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Fecha</th>
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Hora</th>
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Turno</th>
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Responsable</th>
            ${pccHeaders}
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Estado</th>
            <th style="background-color: #cbd5e1; border: 1px solid #000;">Medidas Correctoras</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria_APPCC_${mesFiltro}_${datosEstablecimientoAPPCC.nombre.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros en el mes seleccionado para exportar.');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Turno', 'Responsable', ...puntosControlAPPCC.map(p => `${p.nombre} (${p.unidad})`), 'Incidencia', 'Accion Correctora'];
    const rows = registrosFiltrados.map(r => {
      const rowData = [
        r.fecha,
        r.hora,
        r.turno,
        r.responsable
      ];

      puntosControlAPPCC.forEach(p => {
        const med = r.mediciones.find(m => m.puntoId === p.id);
        rowData.push(med ? `${med.valor}º` : '-');
      });

      rowData.push(r.incidenciaDetectada ? 'NO CONFORME' : 'CONFORME');
      
      const acciones = r.mediciones
        .filter(m => m.accionCorrectora)
        .map(m => `${m.nombrePunto}: ${m.accionCorrectora}`)
        .join(' | ');
      rowData.push(acciones || 'Ninguna');

      return rowData.map(val => `"${val}"`).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APPCC_Sanidad_${mesFiltro}_${datosEstablecimientoAPPCC.nombre.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyWhatsApp = () => {
    if (registrosFiltrados.length === 0) return;
    let text = `🛡️ *INFORME MENSUAL APPCC / SANIDAD* [${mesFiltro}]\n`;
    text += `Establecimiento: *${datosEstablecimientoAPPCC.nombre}* (CIF: ${datosEstablecimientoAPPCC.cif})\n`;
    text += `Responsable Sanitario: ${datosEstablecimientoAPPCC.responsable}\n\n`;
    text += `📊 *Resumen de Cumplimiento:*\n`;
    text += `• Total controles registrados: ${totalLecturas}\n`;
    text += `• Tasa de conformidad higiénica: ${porcentajeConformidad}%\n`;
    text += `• Desviaciones registradas y corregidas: ${totalIncidencias}\n\n`;
    text += `*Últimos 3 registros:*\n`;

    registrosFiltrados.slice(0, 3).forEach(r => {
      text += `📅 ${r.fecha} [Turno ${r.turno} - ${r.responsable}]: ${r.incidenciaDetectada ? '⚠️ Incidencia solventada' : '✅ 100% Conforme'}\n`;
    });

    text += `\nDocumento oficial sellado en el sistema MisePro y listo para inspección sanitaria.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiadoWhatsapp(true);
      setTimeout(() => setCopiadoWhatsapp(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Estilos CSS específicos para Impresión Oficial A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #appcc-printable-report, #appcc-printable-report * {
            visibility: visible;
          }
          #appcc-printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 12mm 15mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Contenedor Principal del Modal */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        
        {/* Cabecera de Acciones (No imprimible) */}
        <div className="no-print p-4 sm:p-6 border-b border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Dossier Oficial APPCC</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  Sanidad CE 852/2004
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Documento legal de control de temperaturas listo para auditoría o archivo.
              </p>
            </div>
          </div>

          {/* Selector de Mes y Botones de Acción */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-700 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <input
                type="month"
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleExportWord}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="Descargar documento oficial editable para Microsoft Word o Google Docs"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Word (.doc)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="Descargar hoja de cálculo para Excel o Google Sheets"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Excel (.xls)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="min-h-[40px] px-2.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Exportar datos en archivo CSV plano"
            >
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="Imprimir documento en papel o vista previa A4"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden md:inline">Imprimir A4</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiadoWhatsapp
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 hover:bg-stone-100 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-200'
              }`}
              title="Copiar resumen formal para WhatsApp"
            >
              {copiadoWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copiadoWhatsapp ? 'Copiado' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={onClose}
              className="min-h-[40px] w-10 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Formulario de Configuración del Local (No imprimible) */}
        {editandoDatos ? (
          <form onSubmit={handleGuardarDatos} className="no-print p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={nombreLocal}
              onChange={(e) => setNombreLocal(e.target.value)}
              placeholder="Nombre del Establecimiento"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg text-xs font-bold"
              required
            />
            <input
              type="text"
              value={cifLocal}
              onChange={(e) => setCifLocal(e.target.value)}
              placeholder="CIF / NIF Sanitario"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg text-xs font-bold"
              required
            />
            <input
              type="text"
              value={responsableLocal}
              onChange={(e) => setResponsableLocal(e.target.value)}
              placeholder="Responsable Técnico"
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg text-xs font-bold"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 text-stone-950 font-black text-xs rounded-lg cursor-pointer"
            >
              Guardar Datos
            </button>
            <button
              type="button"
              onClick={() => setEditandoDatos(false)}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <div className="no-print px-6 py-2 bg-stone-100 dark:bg-slate-800/40 text-[11px] flex items-center justify-between text-stone-500 border-b border-stone-200 dark:border-slate-800">
            <span>
              Establecimiento: <strong>{datosEstablecimientoAPPCC.nombre}</strong> • CIF: <strong>{datosEstablecimientoAPPCC.cif}</strong> • Responsable: <strong>{datosEstablecimientoAPPCC.responsable}</strong>
            </span>
            <button
              type="button"
              onClick={() => setEditandoDatos(true)}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Editar datos legales
            </button>
          </div>
        )}

        {/* ÁREA DE DOCUMENTO OFICIAL A4 (Imprimible y visualizable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100 dark:bg-slate-950/60 print:bg-white print:p-0">
          <div 
            id="appcc-printable-report" 
            ref={reportRef}
            className="w-full max-w-4xl mx-auto bg-white text-stone-900 p-8 rounded-2xl border border-stone-200 shadow-lg print:shadow-none print:border-none print:p-0 print:max-w-none"
          >
            {/* Cabecera Reglamentaria */}
            <div className="border-b-2 border-stone-900 pb-4 mb-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-bold block mb-1">
                  SISTEMA DE AUTOCONTROL HIGIÉNICO-SANITARIO (APPCC)
                </span>
                <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight uppercase text-stone-950">
                  Hoja de Registro de Temperaturas y Medidas Correctoras
                </h1>
                <p className="text-xs text-stone-600 mt-0.5">
                  Conforme al Reglamento (CE) Nº 852/2004 y Real Decreto 1021/2022 de higiene en hostelería.
                </p>
              </div>

              <div className="text-right border-l-2 border-stone-200 pl-4">
                <span className="text-xs font-bold uppercase text-stone-500 block">Período de Control:</span>
                <span className="text-lg font-black text-stone-900 font-mono">{mesFiltro}</span>
              </div>
            </div>

            {/* Metadatos del Negocio */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-stone-50 border border-stone-200 rounded-xl mb-6 text-xs">
              <div>
                <span className="text-stone-500 font-bold uppercase text-[10px] block">Establecimiento:</span>
                <span className="font-black text-stone-900">{datosEstablecimientoAPPCC.nombre}</span>
              </div>
              <div>
                <span className="text-stone-500 font-bold uppercase text-[10px] block">CIF / NIF:</span>
                <span className="font-mono font-bold text-stone-900">{datosEstablecimientoAPPCC.cif}</span>
              </div>
              <div>
                <span className="text-stone-500 font-bold uppercase text-[10px] block">Responsable Sanitario:</span>
                <span className="font-bold text-stone-900">{datosEstablecimientoAPPCC.responsable}</span>
              </div>
            </div>

            {/* Rangos Legales de Referencia */}
            <div className="mb-5 p-2.5 bg-stone-100/60 rounded-lg text-[10px] text-stone-600 flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-bold text-stone-900 uppercase">Límites Críticos Legales:</span>
              {puntosControlAPPCC.map(p => (
                <span key={p.id}>
                  <strong>{p.nombre}:</strong> {p.tempMinLegal}º a {p.tempMaxLegal} {p.unidad}
                </span>
              ))}
            </div>

            {/* Tabla Matricial de Registros */}
            {registrosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-stone-400 font-serif">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">No existen lecturas registradas para el mes de {mesFiltro}.</p>
                <p className="text-xs text-stone-500 mt-1">Realiza las tomas en la pestaña APPCC para autocompletar esta hoja de inspección.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-stone-800 bg-stone-100 text-stone-800 uppercase font-black tracking-tight">
                      <th className="py-2 px-1.5">Fecha</th>
                      <th className="py-2 px-1.5">Hora</th>
                      <th className="py-2 px-1.5">Turno</th>
                      {puntosControlAPPCC.map(p => (
                        <th key={p.id} className="py-2 px-1.5 text-center font-bold">
                          {p.nombre.replace('Cámara ', 'C. ')}
                        </th>
                      ))}
                      <th className="py-2 px-1.5 text-center">Estado</th>
                      <th className="py-2 px-2">Medidas Correctoras</th>
                      <th className="py-2 px-1.5 text-center">Firma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r, idx) => (
                      <tr 
                        key={r.id} 
                        className={`border-b border-stone-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'} ${
                          r.incidenciaDetectada ? 'bg-red-50/60' : ''
                        }`}
                      >
                        <td className="py-2 px-1.5 font-mono font-bold whitespace-nowrap">{r.fecha}</td>
                        <td className="py-2 px-1.5 font-mono text-stone-500">{r.hora}</td>
                        <td className="py-2 px-1.5 font-semibold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.turno === 'Mañana' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                          }`}>
                            {r.turno}
                          </span>
                        </td>
                        
                        {/* Columnas de Puntos de Control */}
                        {puntosControlAPPCC.map(p => {
                          const med = r.mediciones.find(m => m.puntoId === p.id);
                          if (!med) return <td key={p.id} className="py-2 px-1.5 text-center text-stone-400">-</td>;
                          return (
                            <td 
                              key={p.id} 
                              className={`py-2 px-1.5 text-center font-mono font-bold ${
                                !med.conforme ? 'text-red-700 bg-red-100/80 rounded' : 'text-stone-900'
                              }`}
                            >
                              {med.valor}º
                            </td>
                          );
                        })}

                        {/* Estado Conforme / No Conforme */}
                        <td className="py-2 px-1.5 text-center">
                          {r.incidenciaDetectada ? (
                            <span className="font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded text-[9px] uppercase">
                              Desviación
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded text-[9px] uppercase">
                              OK
                            </span>
                          )}
                        </td>

                        {/* Medidas Correctoras */}
                        <td className="py-2 px-2 text-[10px] text-stone-600 max-w-[180px]">
                          {r.mediciones.some(m => m.accionCorrectora) ? (
                            <span className="text-red-900 font-medium">
                              {r.mediciones.filter(m => m.accionCorrectora).map(m => m.accionCorrectora).join(', ')}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">Conforme</span>
                          )}
                        </td>

                        {/* Firma de la brigada */}
                        <td className="py-2 px-1.5 text-center font-serif text-[10px] text-stone-500 italic">
                          {r.responsable}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pie de Certificación y Firma Sanitaria */}
            <div className="mt-8 pt-6 border-t-2 border-stone-800 grid grid-cols-2 gap-8 text-xs">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                  Resumen de Auditoría Mensual:
                </h4>
                <ul className="space-y-1 text-stone-700 font-medium">
                  <li>• Total de comprobaciones registradas: <strong>{totalLecturas}</strong></li>
                  <li>• Índice de cumplimiento sanitario: <strong>{porcentajeConformidad}%</strong></li>
                  <li>• Acciones correctoras implementadas: <strong>{totalIncidencias}</strong></li>
                </ul>
              </div>

              <div className="flex flex-col justify-end items-end">
                <div className="w-56 border-b border-stone-400 pb-12 mb-1 text-center text-stone-400 italic text-[11px]">
                  Sello y Firma del Responsable
                </div>
                <span className="text-[10px] text-stone-500 font-mono">
                  {datosEstablecimientoAPPCC.responsable} • Fecha: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
