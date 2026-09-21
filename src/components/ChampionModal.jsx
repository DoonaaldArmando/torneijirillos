import React, { useEffect } from "react";
import { Trophy, Sparkles, RefreshCw, Star } from "lucide-react";
import confetti from "canvas-confetti";

export default function ChampionModal({ champion, onReset, onClose }) {
  useEffect(() => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  if (!champion) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-fade-in text-center border-2 border-amber-400 relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#07090e]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-2xl shadow-amber-500/40 mx-auto mb-5 animate-bounce">
          <div className="w-full h-full bg-[#0d121f] rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> ¡Campeón del Torneo Coronado!
        </div>

        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">
          {champion.name}
        </h2>
        <p className="text-slate-400 text-sm mb-6 flex items-center justify-center gap-2">
          <span>Clasificado del Grupo {champion.groupLabel || "General"}</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-current" /> Campeón Invicto
          </span>
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary px-5 font-bold"
          >
            Ver Cuadro Eliminatorio
          </button>
          <button
            onClick={onReset}
            className="btn btn-primary px-6 font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Iniciar Nuevo Torneo
          </button>
        </div>
      </div>
    </div>
  );
}
