import React, { useState } from "react";
import { Trophy, RefreshCw, Layers, Award, CheckCircle2, AlertTriangle, ArrowLeft, Database } from "lucide-react";

export default function Navbar({
  currentView, // 'dashboard' | 'tournament_detail'
  tournamentName,
  phase,
  totalGroups,
  groupMatchesCompleted,
  totalGroupMatches,
  onReset,
  onSelectPhase,
  onGenerateKnockout,
  onGoToDashboard
}) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleConfirmReset = () => {
    setShowConfirmReset(false);
    onReset();
  };

  const isTournamentStarted = phase !== "setup" && totalGroups > 0;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/80 border-b border-white/10 px-4 lg:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          {currentView === "tournament_detail" && (
            <button
              onClick={onGoToDashboard}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-[#ff5e1e] transition-colors flex items-center justify-center mr-1"
              title="Volver al Dashboard de Torneos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div
            onClick={onGoToDashboard}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5e1e] to-[#ff9e00] p-0.5 shadow-lg shadow-[#ff5e1e]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#ff5e1e]" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                torneijirillos <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff5e1e]/20 text-[#ff763b] border border-[#ff5e1e]/40 font-bold uppercase tracking-wider">Pro</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {currentView === "tournament_detail" && tournamentName ? (
                  <span className="text-[#00f2fe] font-semibold">{tournamentName}</span>
                ) : (
                  "Gestor de Torneos Simultáneos"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Progress (Only when viewing active tournament) */}
        {currentView === "tournament_detail" && (
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/10">
            {/* Fase 1 */}
            <button
              type="button"
              onClick={() => isTournamentStarted && onSelectPhase && onSelectPhase("setup")}
              disabled={!isTournamentStarted}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                phase === "setup" ? "text-[#ff5e1e]" : "text-emerald-400 cursor-pointer hover:text-emerald-300"
              }`}
            >
              {phase !== "setup" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-[#ff5e1e] animate-ping" />}
              1. Configuración
            </button>

            <span className="text-slate-700">/</span>

            {/* Fase 2 */}
            <button
              type="button"
              onClick={() => isTournamentStarted && onSelectPhase && onSelectPhase("groups")}
              disabled={!isTournamentStarted}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                phase === "groups"
                  ? "text-[#ff5e1e]"
                  : isTournamentStarted
                  ? "text-slate-300 cursor-pointer hover:text-[#ff763b]"
                  : "text-slate-500 cursor-not-allowed"
              }`}
            >
              {phase === "knockout" || phase === "champion" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : phase === "groups" ? <div className="w-2 h-2 rounded-full bg-[#ff5e1e] animate-ping" /> : null}
              2. Fase de Grupos
            </button>

            <span className="text-slate-700">/</span>

            {/* Fase 3 */}
            <button
              type="button"
              onClick={() => isTournamentStarted && onGenerateKnockout && onGenerateKnockout()}
              disabled={!isTournamentStarted}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                phase === "knockout"
                  ? "text-[#ff5e1e]"
                  : isTournamentStarted
                  ? "text-slate-300 cursor-pointer hover:text-[#ff763b]"
                  : "text-slate-500 cursor-not-allowed"
              }`}
            >
              {phase === "champion" ? <Award className="w-3.5 h-3.5 text-amber-400" /> : phase === "knockout" ? <div className="w-2 h-2 rounded-full bg-[#ff5e1e] animate-ping" /> : null}
              3. Cuadro Eliminatorio
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {currentView === "tournament_detail" && phase !== "setup" && (
            <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-800/60 px-3 py-1.5 rounded-lg border border-white/5 text-slate-300">
              <span className="flex items-center gap-1 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#00f2fe]" /> {totalGroups} Grupos
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono">
                Partidos: {groupMatchesCompleted}/{totalGroupMatches}
              </span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Database className="w-3 h-3" /> Auto-guardado
          </div>

          {currentView === "tournament_detail" && (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="btn btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5 hover:text-rose-400 transition-colors"
              title="Reiniciar marcadores de este torneo"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
            </button>
          )}

          {currentView === "tournament_detail" && (
            <button
              onClick={onGoToDashboard}
              className="btn btn-primary text-xs font-bold py-2 px-3 flex items-center gap-1.5"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Reiniciar este Torneo?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Esto borrará las posiciones de los grupos, marcadores y cuadro eliminatorio de este torneo.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="btn btn-secondary px-5"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="btn btn-danger px-5 font-bold"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
