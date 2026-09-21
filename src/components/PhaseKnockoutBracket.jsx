import React, { useState } from "react";
import { Award, Trophy, CheckCircle2 } from "lucide-react";
import MatchScoreModal from "./MatchScoreModal";
import ChampionModal from "./ChampionModal";

export default function PhaseKnockoutBracket({ bracketData, onUpdateWinner, onReset }) {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showChampionModal, setShowChampionModal] = useState(false);

  const rounds = bracketData.rounds || [];
  const totalRounds = bracketData.totalRounds || 1;
  const numByes = bracketData.numByes || 0;

  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound ? finalRound[0] : null;
  const champion = finalMatch && finalMatch.completed ? finalMatch.winner : null;

  React.useEffect(() => {
    if (champion) {
      setShowChampionModal(true);
    }
  }, [champion]);

  const getRoundTitle = (roundNum, maxRounds) => {
    const diff = maxRounds - roundNum;
    if (diff === 0) return "🏆 Gran Final";
    if (diff === 1) return "Semifinales";
    if (diff === 2) return "Cuartos de Final";
    if (diff === 3) return "Octavos de Final";
    return `Ronda ${roundNum}`;
  };

  const handleMatchClick = (matchNode) => {
    if (matchNode.isByeMatch || matchNode.completed && matchNode.player2?.isBye) {
      return;
    }
    if (matchNode.player1 && matchNode.player2) {
      setSelectedMatch(matchNode);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Top Banner */}
      <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-t-[#ff5e1e]">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5e1e]/15 border border-[#ff5e1e]/30 text-[#ff8c53] text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Fase 3: Eliminación Directa
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Cuadro del Torneo <span className="title-gradient">Interactivo</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Sembrado aplicado: Enfrentamientos 1.º vs 2.º, separación por mitades opuestas del mismo grupo, y {numByes} pase{numByes === 1 ? '' : 's'} directo{numByes === 1 ? '' : 's'} (BYE). Haz clic en cualquier partido para registrar el resultado.
          </p>
        </div>

        {champion && (
          <button
            onClick={() => setShowChampionModal(true)}
            className="btn btn-primary text-xs font-bold py-2.5 px-5 flex items-center gap-2 shadow-lg pulse-glow"
          >
            <Trophy className="w-4 h-4 text-amber-300" /> Ver Campeón ({champion.name})
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Bracket Canvas */}
      <div className="glass-panel p-6 overflow-x-auto min-h-[500px]">
        <div className="flex gap-8 md:gap-12 min-w-[800px] py-4 items-stretch justify-start">
          {rounds.map((roundNodes, rIdx) => {
            const roundNum = rIdx + 1;
            const roundTitle = getRoundTitle(roundNum, totalRounds);

            return (
              <div key={rIdx} className="flex-1 min-w-[240px] flex flex-col justify-around space-y-6">
                <div className="text-center pb-3 border-b border-white/10 mb-2">
                  <span className="text-xs font-mono font-bold uppercase text-[#00f2fe] tracking-wider block">
                    Ronda {roundNum}
                  </span>
                  <h4 className="text-sm font-extrabold text-white">{roundTitle}</h4>
                </div>

                <div className="flex flex-col justify-around flex-grow space-y-6">
                  {roundNodes.map((mNode) => {
                    const canClick = Boolean(mNode.player1 && mNode.player2 && !mNode.player2?.isBye);
                    const p1 = mNode.player1;
                    const p2 = mNode.player2;

                    const p1IsWinner = mNode.completed && mNode.winner?.id === p1?.id;
                    const p2IsWinner = mNode.completed && mNode.winner?.id === p2?.id;

                    return (
                      <div
                        key={mNode.id}
                        onClick={() => canClick && handleMatchClick(mNode)}
                        className={`rounded-xl border p-3 transition-all relative ${
                          canClick
                            ? "cursor-pointer hover:border-[#ff5e1e] hover:shadow-lg hover:shadow-[#ff5e1e]/20"
                            : "cursor-default"
                        } ${
                          mNode.completed
                            ? "bg-slate-900/90 border-white/15"
                            : "bg-slate-950/70 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400 mb-2 pb-1.5 border-b border-white/5">
                          <span>Partido #{mNode.matchIndex + 1}</span>
                          {mNode.isByeMatch ? (
                            <span className="text-amber-400 font-sans font-bold">PASE DIRECTO</span>
                          ) : mNode.completed ? (
                            <span className="text-emerald-400 font-sans font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completado
                            </span>
                          ) : canClick ? (
                            <span className="text-[#ff763b] font-sans">Clic para Anotar</span>
                          ) : (
                            <span className="text-slate-500">Esperando clasificados</span>
                          )}
                        </div>

                        {/* Jugador 1 */}
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg mb-1.5 transition-colors ${
                            p1IsWinner
                              ? "bg-emerald-950/40 border border-emerald-500/40 text-white font-bold"
                              : p1
                              ? "bg-slate-900/80 text-slate-200"
                              : "bg-slate-950/40 text-slate-600 italic"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {p1?.groupLabel && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                                {p1.groupLabel}{p1.groupRank}
                              </span>
                            )}
                            <span className="text-xs truncate">{p1 ? p1.name : "Por determinar"}</span>
                          </div>
                          {mNode.completed && mNode.score1 !== null && (
                            <span className={`text-xs font-mono font-black ${p1IsWinner ? "text-emerald-400" : "text-slate-400"}`}>
                              {mNode.score1}
                            </span>
                          )}
                        </div>

                        {/* Jugador 2 */}
                        <div
                          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                            p2IsWinner
                              ? "bg-emerald-950/40 border border-emerald-500/40 text-white font-bold"
                              : p2?.isBye
                              ? "bg-amber-950/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30"
                              : p2
                              ? "bg-slate-900/80 text-slate-200"
                              : "bg-slate-950/40 text-slate-600 italic"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {p2?.groupLabel && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                                {p2.groupLabel}{p2.groupRank}
                              </span>
                            )}
                            <span className="text-xs truncate">{p2 ? p2.name : "Por determinar"}</span>
                          </div>
                          {mNode.completed && mNode.score2 !== null && (
                            <span className={`text-xs font-mono font-black ${p2IsWinner ? "text-emerald-400" : "text-slate-400"}`}>
                              {mNode.score2}
                            </span>
                          )}
                        </div>

                        {mNode.completed && mNode.setDetails && mNode.setDetails.length > 0 && (
                          <div className="text-[10px] font-mono text-slate-400 text-center mt-1.5 pt-1 border-t border-white/5">
                            Sets: {mNode.setDetails.map((s) => `${s.p1Points}-${s.p2Points}`).join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Podio del Campeón */}
          <div className="min-w-[200px] flex flex-col justify-center items-center text-center pl-4 border-l border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30 mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d121f] rounded-[14px] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider block mb-1">
              CAMPEÓN
            </span>
            {champion ? (
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">{champion.name}</h3>
                <span className="badge badge-orange text-[10px]">Ganador del Grupo {champion.groupLabel}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">Juega el cuadro para coronar al campeón</span>
            )}
          </div>
        </div>
      </div>

      {selectedMatch && (
        <MatchScoreModal
          match={{
            id: selectedMatch.id,
            player1: selectedMatch.player1,
            player2: selectedMatch.player2,
            score1: selectedMatch.score1,
            score2: selectedMatch.score2,
            setDetails: selectedMatch.setDetails
          }}
          onClose={() => setSelectedMatch(null)}
          onSaveScore={(mId, s1, s2, winnerId, setDetails) => {
            onUpdateWinner(selectedMatch.round, selectedMatch.matchIndex, winnerId, s1, s2, setDetails);
            setSelectedMatch(null);
          }}
        />
      )}

      {showChampionModal && (
        <ChampionModal
          champion={champion}
          onReset={() => {
            setShowChampionModal(false);
            onReset();
          }}
          onClose={() => setShowChampionModal(false)}
        />
      )}
    </div>
  );
}
