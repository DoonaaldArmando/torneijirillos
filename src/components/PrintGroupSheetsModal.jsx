import React, { useState } from "react";
import { Printer, X, Layers } from "lucide-react";

export default function PrintGroupSheetsModal({ tournamentName, groups, matchesMap, onClose }) {
  const [selectedGroupIndices, setSelectedGroupIndices] = useState(
    groups.map((g) => g.index)
  );

  const toggleGroupSelection = (idx) => {
    setSelectedGroupIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const selectAllGroups = () => {
    setSelectedGroupIndices(groups.map((g) => g.index));
  };

  const deselectAllGroups = () => {
    setSelectedGroupIndices([]);
  };

  const selectedGroups = groups.filter((g) => selectedGroupIndices.includes(g.index));

  const getGroupMatchups = (group) => {
    if (!group) return [];
    if (matchesMap && matchesMap[group.index] && matchesMap[group.index].length > 0) {
      return matchesMap[group.index];
    }
    const players = group.players || [];
    const p1 = players[0] || { name: `Jugador ${group.index * 4 + 1}` };
    const p2 = players[1] || { name: `Jugador ${group.index * 4 + 2}` };
    const p3 = players[2] || { name: `Jugador ${group.index * 4 + 3}` };
    const p4 = players[3] || { name: `Jugador ${group.index * 4 + 4}` };
    return [
      { id: '1', player1: p1, player2: p2 },
      { id: '2', player1: p3, player2: p4 },
      { id: '3', player1: p1, player2: p3 },
      { id: '4', player1: p2, player2: p4 },
      { id: '5', player1: p1, player2: p4 },
      { id: '6', player1: p2, player2: p3 },
    ];
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  const handleDownloadGoogleDoc = () => {
    if (selectedGroups.length === 0) return;

    let docHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${tournamentName || "Torneo Tenis de Mesa"} - Planillas de Grupos (Horizontal)</title>
        <style>
          @page {
            size: landscape;
            size: 11in 8.5in;
            margin: 0.3in;
          }
          @page Section1 {
            size: 11.0in 8.5in;
            mso-page-orientation: landscape;
            margin: 0.3in;
          }
          div.Section1 {
            page: Section1;
          }
          body { font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.0; }
        </style>
      </head>
      <body>
        <div class="Section1">
    `;

    selectedGroups.forEach((group, idx) => {
      const matches = getGroupMatchups(group);

      docHTML += `
        <div style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-top: 6pt; margin-bottom: 2pt; text-transform: uppercase; border-bottom: 1.5pt solid #000000; color: #000000; line-height: 1.1;">${group.name}</div>
        <table border="1" cellspacing="0" cellpadding="2" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 8pt; font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.0;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 5%; text-align: center; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">PART.</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 25%; text-align: right; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">JUGADOR A</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 25%; text-align: left; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">JUGADOR B</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 45%; text-align: center; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">PARCIALES POR SET (HASTA 5 SETS)</th>
            </tr>
          </thead>
          <tbody>
      `;

      matches.forEach((m, mIdx) => {
        const p1Name = m.player1?.name?.trim() || `Jugador ${group.index * 4 + 1}`;
        const p2Name = m.player2?.name?.trim() || `Jugador ${group.index * 4 + 2}`;

        docHTML += `
          <tr style="height: 16pt;">
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: center; font-weight: bold; font-size: 8pt;">#${mIdx + 1}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: right; font-size: 8pt;">${p1Name}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: left; font-size: 8pt;">${p2Name}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: center; font-family: 'Courier New', monospace; font-size: 8pt; white-space: nowrap;">( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; )</td>
          </tr>
        `;
      });

      docHTML += `
          </tbody>
        </table>
      `;

      // 2 groups per landscape page
      if (idx % 2 === 1 && idx < selectedGroups.length - 1) {
        docHTML += `<br clear="all" style="page-break-before: always;" />`;
      }
    });

    docHTML += `
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(tournamentName || "torneo").toLowerCase().replace(/\s+/g, "_")}_planillas_horizontal.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyGoogleDoc = async () => {
    if (selectedGroups.length === 0) return;

    let htmlSnippet = ``;

    selectedGroups.forEach((group, idx) => {
      const matches = getGroupMatchups(group);
      htmlSnippet += `
        <div style="font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; margin-top: 6pt; margin-bottom: 2pt; text-transform: uppercase; border-bottom: 1.5pt solid #000000; color: #000000; line-height: 1.1;">${group.name}</div>
        <table border="1" cellspacing="0" cellpadding="2" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 8pt; font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.0;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 5%; text-align: center; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">PART.</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 25%; text-align: right; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">JUGADOR A</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 25%; text-align: left; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">JUGADOR B</th>
              <th style="border: 1px solid #000000; padding: 1.5pt 4pt; width: 45%; text-align: center; font-weight: bold; font-size: 8pt; text-transform: uppercase; background-color: #f0f0f0;">PARCIALES POR SET (HASTA 5 SETS)</th>
            </tr>
          </thead>
          <tbody>
      `;

      matches.forEach((m, mIdx) => {
        const p1Name = m.player1?.name?.trim() || `Jugador ${group.index * 4 + 1}`;
        const p2Name = m.player2?.name?.trim() || `Jugador ${group.index * 4 + 2}`;

        htmlSnippet += `
          <tr style="height: 16pt;">
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: center; font-weight: bold; font-size: 8pt;">#${mIdx + 1}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: right; font-size: 8pt;">${p1Name}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: left; font-size: 8pt;">${p2Name}</td>
            <td style="border: 1px solid #000000; padding: 1.5pt 4pt; text-align: center; font-family: 'Courier New', monospace; font-size: 8pt; white-space: nowrap;">( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; ) &nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp; )</td>
          </tr>
        `;
      });

      htmlSnippet += `
          </tbody>
        </table>
      `;

      if (idx % 2 === 1 && idx < selectedGroups.length - 1) {
        htmlSnippet += `<br clear="all" style="page-break-before: always;" />`;
      }
    });

    try {
      const blob = new Blob([htmlSnippet], { type: "text/html" });
      const data = [new ClipboardItem({ "text/html": blob })];
      await navigator.clipboard.write(data);
      alert("¡Tablas copiadas al portapapeles! Abre Google Docs y presiona Ctrl + V para pegarlas directamente.");
    } catch (err) {
      alert("No se pudo acceder al portapapeles. Usa el botón 'Descargar para Google Docs'.");
    }
  };

  return (
    <div className="modal-overlay z-50">
      <div className="modal-card max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-fade-in p-6 bg-slate-900 border border-slate-700">
        
        {/* Controls Header (Hidden during print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f2fe]/20 text-[#00f2fe] flex items-center justify-center border border-[#00f2fe]/40">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Exportar Planillas de Grupos</h3>
              <p className="text-xs text-slate-400">
                Descarga para Google Docs / Word o copia directamente al portapapeles.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar (Hidden during print) */}
        <div className="no-print bg-slate-950/80 p-4 rounded-2xl border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Seleccionar Grupos ({selectedGroupIndices.length}/{groups.length})
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAllGroups}
                className="text-[#00f2fe] hover:underline font-semibold"
              >
                Todos
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={deselectAllGroups}
                className="text-slate-400 hover:underline"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-white/5 scrollbar-thin">
            {groups.map((g) => {
              const isSelected = selectedGroupIndices.includes(g.index);
              return (
                <button
                  key={g.index}
                  type="button"
                  onClick={() => toggleGroupSelection(g.index)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isSelected
                      ? "bg-[#ff5e1e] text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 mb-6 border-t border-white/10">
          <span className="text-xs text-slate-400 font-mono">
            {selectedGroups.length} grupo{selectedGroups.length === 1 ? "" : "s"} seleccionado{selectedGroups.length === 1 ? "" : "s"}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyGoogleDoc}
              disabled={selectedGroups.length === 0}
              className="btn btn-secondary text-xs px-3.5 py-2 font-semibold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 disabled:opacity-40"
              title="Copiar tablas al portapapeles para pegar en Google Docs con Ctrl+V"
            >
              📋 Copiar para Google Docs
            </button>

            <button
              type="button"
              onClick={handleDownloadGoogleDoc}
              disabled={selectedGroups.length === 0}
              className="btn btn-primary text-xs px-5 py-2 font-bold flex items-center gap-1.5 disabled:opacity-40"
              title="Descargar archivo .doc compatible con Google Docs y Microsoft Word"
            >
              📄 Descargar .doc (Google Docs)
            </button>
          </div>
        </div>

        {/* Printable View Container */}
        <div id="printable-area" className="print-area space-y-2">
          {selectedGroups.length === 0 ? (
            <div className="no-print p-8 text-center text-slate-500 text-sm">
              Selecciona al menos un grupo para imprimir.
            </div>
          ) : (
            selectedGroups.map((group, idx) => {
              const matches = getGroupMatchups(group);

              return (
                <div
                  key={group.index}
                  className={`print-group-card bg-white text-slate-900 rounded-lg p-2 border border-slate-300 shadow-sm font-sans ${
                    idx % 2 === 1 ? "page-break-after" : ""
                  }`}
                  style={{ breakInside: "avoid" }}
                >
                  {/* Encabezado del Grupo */}
                  <div className="border-b border-slate-400 pb-0.5 mb-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase">
                      {group.name}
                    </h3>
                  </div>

                  {/* Tabla de 6 Enfrentamientos del Grupo */}
                  <div>
                    <table className="w-full text-xs border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[9px]">
                          <th className="border border-slate-400 py-0.5 px-1 w-8 text-center">Part.</th>
                          <th className="border border-slate-400 py-0.5 px-1 text-right w-3/12">Jugador A</th>
                          <th className="border border-slate-400 py-0.5 px-1 text-left w-3/12">Jugador B</th>
                          <th className="border border-slate-400 py-0.5 px-1 text-center">Parciales por Set (Hasta 5 Sets)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-medium text-[10px]">
                        {matches.map((m, mIdx) => {
                          const p1Name = m.player1?.name?.trim() || `Jugador ${group.index * 4 + 1}`;
                          const p2Name = m.player2?.name?.trim() || `Jugador ${group.index * 4 + 2}`;

                          return (
                            <tr key={m.id || mIdx}>
                              <td className="border border-slate-400 py-0.5 px-1 text-center font-mono font-bold text-[9px]">#{mIdx + 1}</td>
                              <td className="border border-slate-400 py-0.5 px-1 text-right truncate">
                                {p1Name}
                              </td>
                              <td className="border border-slate-400 py-0.5 px-1 text-left truncate">
                                {p2Name}
                              </td>
                              <td className="border border-slate-400 py-0.5 px-1 text-center font-mono text-[9px] text-slate-600 whitespace-nowrap">
                                <span>(&nbsp;&nbsp;-&nbsp;&nbsp;) (&nbsp;&nbsp;-&nbsp;&nbsp;) (&nbsp;&nbsp;-&nbsp;&nbsp;) (&nbsp;&nbsp;-&nbsp;&nbsp;) (&nbsp;&nbsp;-&nbsp;&nbsp;)</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
