import React, { useState, useMemo } from "react";
import { CheckCircle2, Trophy, ArrowRight, Zap, Edit3, Plus, Printer } from "lucide-react";
import { calculateGroupStandings } from "../utils/tournamentLogic";
import MatchScoreModal from "./MatchScoreModal";
import PrintGroupSheetsModal from "./PrintGroupSheetsModal";

export default function PhaseGroupStage({ groups, matchesMap, tournamentName, onUpdateMatchScore, onUpdatePlayerName, onGenerateKnockout, onAddGroup }) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPlayerNameInput, setNewPlayerNameInput] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // State for Add Group modal
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newPlayerNames, setNewPlayerNames] = useState(["", "", "", ""]);

  const displayedGroups = useMemo(() => {
    if (!groupFilter.trim()) return groups;
    const q = groupFilter.toLowerCase();
    return groups.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.players.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [groups, groupFilter]);

  const activeGroup = groups[selectedGroupIndex] || groups[0] || { index: 0, label: "A", name: "Grupo A", players: [] };
  const activeMatches = matchesMap[activeGroup.index] || [];

  const standings = useMemo(() => {
    if (!activeGroup || !activeGroup.players) return [];
    return calculateGroupStandings(activeGroup, activeMatches);
  }, [activeGroup, activeMatches]);

  const overallStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    Object.values(matchesMap).forEach((mList) => {
      total += mList.length;
      completed += mList.filter((m) => m.completed).length;
    });
    return { total, completed, isAllCompleted: total > 0 && total === completed };
  }, [matchesMap]);

  const handleAddGroupSubmit = (e) => {
    e.preventDefault();
    if (onAddGroup) {
      onAddGroup(newPlayerNames);
      setSelectedGroupIndex(groups.length); // seleccionar el nuevo grupo añadido
    }
    setShowAddGroupModal(false);
    setNewPlayerNames(["", "", "", ""]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Banner & Progreso */}
      <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-t-[#00f2fe]">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f2fe]/15 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Fase 2: Todos contra Todos por Grupos
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Partidos y <span className="title-gradient">Posiciones en Vivo</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Los 2 mejores jugadores de cada grupo avanzan a la Fase Eliminatoria. Victoria = 2 pts, Derrota = 1 pt.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/10 w-full md:w-auto">
          <div className="w-full sm:w-48 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Progreso de Grupos</span>
              <span className="font-mono text-[#00f2fe]">
                {overallStats.completed}/{overallStats.total} ({Math.round((overallStats.completed / overallStats.total) * 100 || 0)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#ff5e1e] to-[#00f2fe] rounded-full transition-all duration-300"
                style={{ width: `${(overallStats.completed / overallStats.total) * 100 || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="btn btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 whitespace-nowrap text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <Printer className="w-4 h-4" /> Imprimir Planillas
            </button>

            <button
              onClick={() => setShowAddGroupModal(true)}
              className="btn btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 whitespace-nowrap text-[#00f2fe] border-[#00f2fe]/40 hover:bg-[#00f2fe]/10"
            >
              <Plus className="w-4 h-4" /> Añadir Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Grupos (Muestra TODOS los grupos con desplazamiento y búsqueda) */}
      <div className="glass-panel p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Grupos del Torneo ({groups.length} Grupos Totales)
          </span>

          <div className="flex items-center gap-3">
            {/* Buscador de Grupos */}
            <input
              type="text"
              placeholder="Buscar grupo (ej. A, AA)..."
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="input-field py-1 px-3 text-xs w-48"
            />

            {/* Selector Desplegable directo */}
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold shrink-0">
              <span className="text-slate-400 whitespace-nowrap">Ir a:</span>
              <select
                value={selectedGroupIndex}
                onChange={(e) => setSelectedGroupIndex(parseInt(e.target.value))}
                className="bg-transparent text-white font-mono text-xs font-bold border-none outline-none focus:ring-0"
              >
                {groups.map((g, idx) => {
                  const gMatches = matchesMap[g.index] || [];
                  const gCompleted = gMatches.filter((m) => m.completed).length;
                  return (
                    <option key={g.index} value={idx} className="bg-slate-900 text-white">
                      Grupo {g.label} ({gCompleted}/6)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Listado Horizontal de Pestañas de Grupos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {displayedGroups.map((g) => {
            const isSelected = activeGroup && activeGroup.index === g.index;
            const gMatches = matchesMap[g.index] || [];
            const gCompleted = gMatches.filter((m) => m.completed).length;

            return (
              <button
                key={g.index}
                onClick={() => {
                  const originalIndex = groups.findIndex((og) => og.index === g.index);
                  if (originalIndex >= 0) setSelectedGroupIndex(originalIndex);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-gradient-to-r from-[#ff5e1e] to-[#ff8c53] text-white border-transparent shadow-lg shadow-[#ff5e1e]/20"
                    : "bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>Grupo {g.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    gCompleted === 6
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isSelected
                      ? "bg-black/20 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {gCompleted}/6
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Principal: Partidos y Tabla de Posiciones */}
      {activeGroup && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Columna Izquierda: Enfrentamientos del Grupo */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Partidos: <span className="text-[#ff763b]">{activeGroup.name}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  6 Enfrentamientos Todos vs Todos
                </span>
              </div>

              <div className="space-y-3">
                {activeMatches.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      m.completed
                        ? "bg-slate-900/90 border-emerald-500/30 shadow-md"
                        : "bg-slate-950/60 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-6 text-[11px] font-mono font-bold text-slate-500">
                        #{m.matchNum}
                      </span>
                    </div>

                    {/* Contendientes */}
                    <div className="flex-1 grid grid-cols-5 items-center gap-2 text-xs font-semibold">
                      {/* Jugador 1 */}
                      <div
                        className={`col-span-2 text-right truncate ${
                          m.winnerId === m.player1.id
                            ? "text-emerald-400 font-bold"
                            : m.completed
                            ? "text-slate-400"
                            : "text-white"
                        }`}
                      >
                        {m.player1.name}
                      </div>

                      {/* Marcador */}
                      <div className="col-span-1 text-center font-mono font-bold">
                        {m.completed ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[#00f2fe] border border-white/10 text-xs">
                            {m.score1} - {m.score2}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">vs</span>
                        )}
                      </div>

                      {/* Jugador 2 */}
                      <div
                        className={`col-span-2 text-left truncate ${
                          m.winnerId === m.player2.id
                            ? "text-emerald-400 font-bold"
                            : m.completed
                            ? "text-slate-400"
                            : "text-white"
                        }`}
                      >
                        {m.player2.name}
                      </div>

                      {/* Parciales por Set */}
                      {m.completed && m.setDetails && m.setDetails.length > 0 && (
                        <div className="col-span-5 text-center text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-white/5">
                          Parciales: {m.setDetails.map((s) => `${s.p1Points}-${s.p2Points}`).join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Botón Cargar Marcador */}
                    <button
                      onClick={() => setEditingMatch(m)}
                      className={`btn text-xs py-1.5 px-3 flex items-center gap-1 font-bold shrink-0 ${
                        m.completed
                          ? "btn-secondary text-slate-300 hover:text-white"
                          : "btn-primary text-white"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {m.completed ? "Editar" : "Anotar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tabla de Posiciones en Vivo */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 border-t-2 border-t-[#00f2fe]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Posiciones:{" "}
                  <span className="text-[#00f2fe]">{activeGroup.name}</span>
                </h3>
              </div>

              {/* Tabla de Posiciones */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase text-slate-400 border-b border-white/10 pb-2">
                      <th className="pb-2 w-8">#</th>
                      <th className="pb-2">Jugador</th>
                      <th className="pb-2 text-center">PJ</th>
                      <th className="pb-2 text-center">G</th>
                      <th className="pb-2 text-center">P</th>
                      <th className="pb-2 text-center text-[#00f2fe]">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {standings.map((st) => {
                      const isQualifying = st.rank <= 2;
                      return (
                        <tr
                          key={st.player.id}
                          className={`hover:bg-white/5 transition-colors ${
                            isQualifying ? "bg-emerald-500/5" : ""
                          }`}
                        >
                          <td className="py-2.5 font-bold font-mono">
                            <span
                              className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                                st.rank === 1
                                  ? "bg-amber-500 text-slate-950 font-black"
                                  : st.rank === 2
                                  ? "bg-slate-300 text-slate-950 font-black"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {st.rank}
                            </span>
                          </td>

                          <td className="py-2.5">
                            <div className="font-semibold text-white flex items-center justify-between gap-1.5 pr-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="truncate">{st.player.name}</span>
                                {isQualifying && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" title="Posición de Clasificación Directa" />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPlayer(st.player);
                                  setNewPlayerNameInput(st.player.name);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-[#00f2fe] hover:bg-slate-800 transition-colors opacity-70 hover:opacity-100 shrink-0"
                                title="Editar nombre del jugador"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {st.tieBreakerReason && (
                              <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                                * {st.tieBreakerReason}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 text-center font-mono">{st.played}</td>
                          <td className="py-2.5 text-center font-mono text-emerald-400">{st.wins}</td>
                          <td className="py-2.5 text-center font-mono text-rose-400">{st.losses}</td>
                          <td className="py-2.5 text-center font-mono font-extrabold text-sm text-[#00f2fe]">
                            {st.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
                <p>* <strong className="text-emerald-400">Posiciones 1º y 2º</strong> clasifican a Eliminatorias.</p>
                <p>* Criterio: Victoria (2 pts), Derrota (1 pt). En empate: Enfrentamiento directo o Ratio de Sets.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Generación del Cuadro */}
      <div className="glass-panel p-6 border-t-2 border-t-[#ff5e1e] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Trophy className="w-5 h-5 text-[#ff5e1e]" /> ¿Cuadro Eliminatorio Listo?
          </h3>
          <p className="text-xs text-slate-400">
            {overallStats.isAllCompleted
              ? "¡Todos los partidos se han completado! Cuadro eliminatorio totalmente poblado."
              : `Progreso: ${overallStats.completed} de ${overallStats.total} partidos completados. Puedes ver o generar el cuadro en cualquier momento.`}
          </p>
        </div>

        <button
          onClick={onGenerateKnockout}
          className="btn btn-primary text-base py-3.5 px-8 font-bold flex items-center gap-2 shadow-2xl"
        >
          Ver / Generar Cuadro Eliminatorio <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Modal: Añadir Nuevo Grupo */}
      {showAddGroupModal && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md animate-fade-in">
            <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00f2fe]" /> Añadir Nuevo Grupo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Añade un nuevo grupo a este torneo en vivo (Grupo {groups.length + 1}). Los resultados de los grupos existentes se mantendrán intactos.
            </p>

            <form onSubmit={handleAddGroupSubmit} className="space-y-3">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Jugador {idx + 1}
                  </label>
                  <input
                    type="text"
                    placeholder={`Jugador ${groups.length * 4 + idx + 1}`}
                    value={newPlayerNames[idx]}
                    onChange={(e) => {
                      const updated = [...newPlayerNames];
                      updated[idx] = e.target.value;
                      setNewPlayerNames(updated);
                    }}
                    className="input-field text-sm"
                  />
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 py-2 font-bold"
                >
                  Añadir Grupo y Partidos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {editingMatch && (
        <MatchScoreModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSaveScore={(matchId, s1, s2, winnerId, setDetails) => {
            onUpdateMatchScore(editingMatch.groupId, matchId, s1, s2, winnerId, setDetails);
            setEditingMatch(null);
          }}
        />
      )}

      {/* Modal: Editar Nombre de Jugador */}
      {editingPlayer && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md animate-fade-in">
            <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#00f2fe]" /> Editar Nombre de Jugador
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              El nuevo nombre se actualizará en todos los partidos de grupo, la tabla de posiciones en vivo y el cuadro eliminatorio.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPlayerNameInput.trim() && onUpdatePlayerName) {
                  onUpdatePlayerName(editingPlayer.id, newPlayerNameInput.trim());
                }
                setEditingPlayer(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Nombre del Jugador
                </label>
                <input
                  type="text"
                  required
                  value={newPlayerNameInput}
                  onChange={(e) => setNewPlayerNameInput(e.target.value)}
                  className="input-field text-sm font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 py-2 font-bold"
                >
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Imprimir Planillas de Grupos */}
      {showPrintModal && (
        <PrintGroupSheetsModal
          tournamentName={tournamentName}
          groups={groups}
          matchesMap={matchesMap}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
