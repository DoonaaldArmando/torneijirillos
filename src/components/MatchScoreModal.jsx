import React, { useState, useMemo } from "react";
import { X, Check, Award, Plus, Trash2, Calculator } from "lucide-react";

export default function MatchScoreModal({ match, onClose, onSaveScore }) {
  const [mode, setMode] = useState("sets"); // 'sets' (punto por punto) o 'direct' (conteo de sets)

  const [setsList, setSetsList] = useState(() => {
    if (match.setDetails && match.setDetails.length > 0) {
      return match.setDetails.map((s) => ({ p1: s.p1Points, p2: s.p2Points }));
    }
    return [
      { p1: "", p2: "" },
      { p1: "", p2: "" },
      { p1: "", p2: "" }
    ];
  });

  const [directScore1, setDirectScore1] = useState(match.score1 !== null ? match.score1 : "");
  const [directScore2, setDirectScore2] = useState(match.score2 !== null ? match.score2 : "");

  const setSummary = useMemo(() => {
    if (!match) return { p1SetsWon: 0, p2SetsWon: 0, evaluatedSets: [], isFinished: false, winnerId: null };
    let p1SetsWon = 0;
    let p2SetsWon = 0;
    const evaluatedSets = [];

    setsList.forEach((s, idx) => {
      const pts1 = parseInt(s.p1);
      const pts2 = parseInt(s.p2);

      const isValid1 = !isNaN(pts1) && pts1 >= 0;
      const isValid2 = !isNaN(pts2) && pts2 >= 0;

      let setWinner = null;
      if (isValid1 && isValid2 && pts1 !== pts2) {
        if (pts1 > pts2) {
          p1SetsWon += 1;
          setWinner = "p1";
        } else {
          p2SetsWon += 1;
          setWinner = "p2";
        }
      }

      evaluatedSets.push({
        setNum: idx + 1,
        p1Points: s.p1,
        p2Points: s.p2,
        pts1: isValid1 ? pts1 : null,
        pts2: isValid2 ? pts2 : null,
        setWinner,
        isValid: isValid1 && isValid2 && pts1 !== pts2
      });
    });

    const isFinished = p1SetsWon !== p2SetsWon && (p1SetsWon > 0 || p2SetsWon > 0);
    const winnerId = isFinished ? (p1SetsWon > p2SetsWon ? match.player1.id : match.player2.id) : null;

    return {
      p1SetsWon,
      p2SetsWon,
      evaluatedSets,
      isFinished,
      winnerId
    };
  }, [setsList, match]);

  const handleSetPointChange = (idx, playerKey, val) => {
    setSetsList((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [playerKey]: val };
      return updated;
    });
  };

  const handleAddSet = () => {
    if (setsList.length < 7) {
      setSetsList((prev) => [...prev, { p1: "", p2: "" }]);
    }
  };

  const handleRemoveSet = (idx) => {
    if (setsList.length > 1) {
      setSetsList((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "sets") {
      const validSetsCount = setSummary.evaluatedSets.filter((s) => s.isValid).length;
      if (validSetsCount === 0) {
        alert("Por favor ingresa los puntos de los sets (ej. 11 - 9) para calcular el ganador del partido.");
        return;
      }
      if (setSummary.p1SetsWon === setSummary.p2SetsWon) {
        alert("¡Los partidos de tenis de mesa no pueden terminar en empate! Ingresa los puntos de otro set para determinar al ganador.");
        return;
      }

      onSaveScore(
        match.id,
        setSummary.p1SetsWon,
        setSummary.p2SetsWon,
        setSummary.winnerId,
        setSummary.evaluatedSets.filter((s) => s.isValid)
      );
    } else {
      const s1 = parseInt(directScore1);
      const s2 = parseInt(directScore2);
      if (isNaN(s1) || isNaN(s2)) {
        alert("Por favor ingresa números válidos de sets.");
        return;
      }
      if (s1 === s2) {
        alert("¡Los sets ganados no pueden ser iguales!");
        return;
      }
      const winnerId = s1 > s2 ? match.player1.id : match.player2.id;
      onSaveScore(match.id, s1, s2, winnerId, null);
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-fade-in max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ff5e1e]" /> Registrar Resultado del Partido
            </h3>
            <p className="text-xs text-slate-400">Ingresa los puntos por set para calcular los sets ganados y el ganador</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("sets")}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === "sets"
                ? "bg-[#ff5e1e] text-white shadow-md shadow-[#ff5e1e]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Punto por Punto (Sets)
          </button>
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === "direct"
                ? "bg-[#ff5e1e] text-white shadow-md shadow-[#ff5e1e]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Conteo Directo de Sets
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Jugadores Banner */}
          <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 mb-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              {/* Jugador 1 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 block truncate">Jugador 1</span>
                <span className="text-base font-extrabold text-white block truncate">{match.player1.name}</span>
                {mode === "sets" && setSummary.isFinished && setSummary.p1SetsWon > setSummary.p2SetsWon && (
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ganador
                  </span>
                )}
              </div>

              {/* Marcador de Sets */}
              <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Marcador de Sets
                </span>
                <span className="text-2xl font-mono font-black text-white">
                  {mode === "sets" ? `${setSummary.p1SetsWon} - ${setSummary.p2SetsWon}` : `${directScore1 || 0} - ${directScore2 || 0}`}
                </span>
              </div>

              {/* Jugador 2 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 block truncate">Jugador 2</span>
                <span className="text-base font-extrabold text-white block truncate">{match.player2.name}</span>
                {mode === "sets" && setSummary.isFinished && setSummary.p2SetsWon > setSummary.p1SetsWon && (
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ganador
                  </span>
                )}
              </div>
            </div>
          </div>

          {mode === "sets" ? (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>Puntos del Set (Primero a 11 pts)</span>
                <span>Ganador del Set</span>
              </div>

              {setSummary.evaluatedSets.map((s, idx) => (
                <div
                  key={idx}
                  className="glass-panel p-3 flex items-center justify-between gap-3 border border-white/10 bg-slate-900/60"
                >
                  <span className="text-xs font-mono font-bold text-slate-300 w-12">
                    Set {s.setNum}
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="11"
                      value={s.p1Points}
                      onChange={(e) => handleSetPointChange(idx, "p1", e.target.value)}
                      className="w-12 h-10 bg-slate-950 border border-[#ff5e1e]/50 text-center font-mono font-bold text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff5e1e]"
                    />
                    <span className="text-slate-600 font-bold">:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="9"
                      value={s.p2Points}
                      onChange={(e) => handleSetPointChange(idx, "p2", e.target.value)}
                      className="w-12 h-10 bg-slate-950 border border-[#00f2fe]/50 text-center font-mono font-bold text-sm text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00f2fe]"
                    />
                  </div>

                  <div className="flex-1 text-right">
                    {s.setWinner === "p1" ? (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-md inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {match.player1.name}
                      </span>
                    ) : s.setWinner === "p2" ? (
                      <span className="text-[11px] font-bold text-[#00f2fe] bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded-md inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {match.player2.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Ingresar puntos</span>
                    )}
                  </div>

                  {setsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {setsList.length < 7 && (
                <button
                  type="button"
                  onClick={handleAddSet}
                  className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs font-bold text-slate-400 hover:border-[#ff5e1e] hover:text-[#ff5e1e] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Set {setsList.length + 1}
                </button>
              )}
            </div>
          ) : (
            <div className="glass-panel p-5 mb-6 text-center space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Conteo Directo de Sets Ganados
              </span>
              <div className="flex items-center justify-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="3"
                  value={directScore1}
                  onChange={(e) => setDirectScore1(e.target.value)}
                  className="w-16 h-14 bg-slate-900 border-2 border-[#ff5e1e] text-center font-mono text-2xl font-black text-white rounded-xl focus:outline-none"
                />
                <span className="text-2xl font-bold text-slate-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="1"
                  value={directScore2}
                  onChange={(e) => setDirectScore2(e.target.value)}
                  className="w-16 h-14 bg-slate-900 border-2 border-[#00f2fe] text-center font-mono text-2xl font-black text-white rounded-xl focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn btn-secondary text-sm">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-sm font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> Guardar Resultado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
