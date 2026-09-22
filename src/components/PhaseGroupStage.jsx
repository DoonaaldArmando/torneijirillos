import React, { useState, useMemo } from "react";
import { CheckCircle2, Trophy, ArrowRight, Zap, HelpCircle, Info, Edit3 } from "lucide-react";
import { calculateGroupStandings } from "../utils/tournamentLogic";
import MatchScoreModal from "./MatchScoreModal";

export default function PhaseGroupStage({ groups, matchesMap, onUpdateMatchScore, onGenerateKnockout }) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [editingMatch, setEditingMatch] = useState(null);
  const [groupFilter, setGroupFilter] = useState("");

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

  const activeGroup = groups[selectedGroupIndex] || groups[0];
  const activeMatches = matchesMap[activeGroup.index] || [];

  const standings = useMemo(() => {
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

        {/* Lista de Botones de TODOS los Grupos */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
          {displayedGroups.map((group) => {
            const idx = group.index;
            const gMatches = matchesMap[group.index] || [];
            const gCompleted = gMatches.filter((m) => m.completed).length;
            const isDone = gCompleted === 6;
            const isSelected = selectedGroupIndex === idx;

            return (
              <button
                key={group.index}
                onClick={() => setSelectedGroupIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-[#ff5e1e] border-[#ff5e1e] text-white shadow-lg shadow-[#ff5e1e]/30 scale-105"
                    : "bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] font-mono ${isSelected ? 'bg-white text-[#ff5e1e]' : 'bg-slate-800 text-slate-400'}`}>
                  {group.label}
                </div>
                <span>{group.name}</span>
                {isDone && <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Arena de Partido y Tabla */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Columna Izquierda: 6 Partidos */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5e1e]" />
              Enfrentamientos del Grupo {activeGroup.label} (6 Partidos)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Orden: 1v2, 3v4, 1v3, 2v4, 1v4, 2v3</span>
          </div>

          {activeMatches.map((m) => {
            const isCompleted = m.completed;
            const p1Won = isCompleted && m.score1 > m.score2;
            const p2Won = isCompleted && m.score2 > m.score1;

            return (
              <div
                key={m.id}
                className={`glass-panel p-4 transition-all border ${
                  isCompleted ? "border-white/10 bg-slate-900/80" : "border-[#ff5e1e]/30 bg-slate-900/40 hover:border-[#ff5e1e]"
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono font-semibold pb-2 border-b border-white/5">
                  <span>Partido #{m.matchNum}</span>
                  {isCompleted ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-sans font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                    </span>
                  ) : (
                    <span className="text-amber-400 font-sans font-medium">Pendiente</span>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* Jugador 1 */}
                  <div className={`text-left space-y-0.5 ${p1Won ? "text-emerald-400 font-bold" : "text-slate-200"}`}>
                    <span className="text-xs text-slate-500 font-mono block">J{m.player1.playerIndex + 1}</span>
                    <span className="text-sm font-semibold truncate block">{m.player1.name}</span>
                  </div>

                  {/* Marcador */}
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <button
                        onClick={() => setEditingMatch(m)}
                        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white transition-colors"
                      >
                        <div className="flex items-center gap-2 font-mono text-base font-black">
                          <span className={p1Won ? "text-emerald-400" : "text-slate-300"}>{m.score1}</span>
                          <span className="text-slate-500 font-normal text-xs">-</span>
                          <span className={p2Won ? "text-emerald-400" : "text-slate-300"}>{m.score2}</span>
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        </div>
                        {m.setDetails && m.setDetails.length > 0 && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({m.setDetails.map((s) => `${s.p1Points}-${s.p2Points}`).join(", ")})
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingMatch(m)}
                        className="btn btn-primary py-1.5 px-3 text-xs font-bold"
                      >
                        Ingresar Marcador
                      </button>
                    )}
                  </div>

                  {/* Jugador 2 */}
                  <div className={`text-right space-y-0.5 ${p2Won ? "text-emerald-400 font-bold" : "text-slate-200"}`}>
                    <span className="text-xs text-slate-500 font-mono block">J{m.player2.playerIndex + 1}</span>
                    <span className="text-sm font-semibold truncate block">{m.player2.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Columna Derecha: Tabla de Posiciones */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Posiciones del Grupo {activeGroup.label}
            </h3>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              Top 2 Clasifican
            </span>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-white/10">
                    <th className="py-3 px-3 text-center">Pos</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-2 text-center" title="Partidos Jugados">PJ</th>
                    <th className="py-3 px-2 text-center" title="Partidos Ganados">PG</th>
                    <th className="py-3 px-2 text-center" title="Partidos Perdidos">PP</th>
                    <th className="py-3 px-2 text-center" title="Sets Ganados - Sets Perdidos">SG-SP</th>
                    <th className="py-3 px-2 text-center" title="Ratio de Sets">Ratio</th>
                    <th className="py-3 px-3 text-center text-[#ff5e1e]" title="Puntos (Victoria=2, Derrota=1)">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standings.map((st) => {
                    const isQualifying = st.rank <= 2;
                    return (
                      <tr
                        key={st.player.id}
                        className={`transition-colors ${
                          isQualifying ? "bg-emerald-950/20 hover:bg-emerald-900/30" : "hover:bg-slate-900/50"
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center font-bold">
                          <div
                            className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-xs font-mono font-black ${
                              st.rank === 1
                                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30"
                                : st.rank === 2
                                ? "bg-slate-300 text-slate-950"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {st.rank}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{st.player.name}</span>
                            {isQualifying && (
                              <span className="badge badge-emerald text-[9px] py-0 px-1.5">Clasificado</span>
                            )}
                          </div>
                          {st.tieBreakerReason && (
                            <div className="text-[10px] text-amber-300 font-medium flex items-center gap-1 mt-0.5">
                              <Info className="w-3 h-3 text-amber-400" /> {st.tieBreakerReason}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-2 text-center font-mono text-slate-400">{st.played}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-bold text-emerald-400">{st.wins}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-400">{st.losses}</td>
                        <td className="py-3.5 px-2 text-center font-mono text-xs text-slate-300">
                          {st.gamesWon}-{st.gamesLost}
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono text-xs text-[#00f2fe] font-bold">
                          {st.gameRatio.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-black text-base text-[#ff5e1e]">
                          {st.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950/80 p-3 text-[11px] text-slate-400 border-t border-white/5 space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#00f2fe]" /> Reglas de Clasificación e Igualdad de Puntos (ITTF):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-normal">
                <li>Victoria = 2 puntos, Derrota = 1 punto</li>
                <li><strong className="text-slate-300">Empate entre 2:</strong> Ganador del partido directo entre ambos</li>
                <li><strong className="text-slate-300">Empate entre 3:</strong> Ratio de Sets (Ganados / Perdidos) solo en partidos entre los 3 empatados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
