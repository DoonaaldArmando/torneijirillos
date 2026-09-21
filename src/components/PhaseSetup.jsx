import React, { useState, useEffect, useMemo } from "react";
import { Users, Play, Sparkles, Plus, Minus, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { generateInitialGroups } from "../utils/tournamentLogic";

export default function PhaseSetup({ onGenerateGroupStage }) {
  const [numGroups, setNumGroups] = useState(3);
  const [groupsData, setGroupsData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const validN = Math.max(1, Math.min(200, numGroups || 1));
    setGroupsData(generateInitialGroups(validN));
    setCurrentPage(1);
  }, [numGroups]);

  const handleGroupCountChange = (val) => {
    let parsed = parseInt(val);
    if (isNaN(parsed)) parsed = 1;
    if (parsed < 1) parsed = 1;
    if (parsed > 200) parsed = 200;
    setNumGroups(parsed);
  };

  const handlePlayerNameChange = (groupIndex, playerIndex, newName) => {
    setGroupsData((prev) =>
      prev.map((g) => {
        if (g.index !== groupIndex) return g;
        const updatedPlayers = g.players.map((p) => {
          if (p.playerIndex !== playerIndex) return p;
          return { ...p, name: newName };
        });
        return { ...g, players: updatedPlayers };
      })
    );
  };

  const handleClearAllNames = () => {
    setGroupsData((prev) =>
      prev.map((g) => ({
        ...g,
        players: g.players.map((p) => ({
          ...p,
          name: ""
        }))
      }))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedGroups = groupsData.map((g) => ({
      ...g,
      players: g.players.map((p, pIdx) => ({
        ...p,
        name: p.name.trim() || `Jugador ${g.index * 4 + pIdx + 1}`
      }))
    }));
    onGenerateGroupStage(processedGroups);
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupsData;
    const q = searchQuery.toLowerCase();
    return groupsData.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.label.toLowerCase().includes(q) ||
        g.players.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [groupsData, searchQuery]);

  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE) || 1;
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGroups.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGroups, currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel p-6 lg:p-8 mb-8 relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 border-t-2 border-t-[#ff5e1e]">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5e1e]/15 border border-[#ff5e1e]/30 text-[#ff8c53] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Fase 1: Configuración del Torneo
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Crea tu Liga de <span className="title-gradient">Tenis de Mesa</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Configura el número total de grupos (N entre 1 y 200). Ingresa los nombres de los jugadores para cada grupo (estrictamente 4 jugadores por grupo).
          </p>
        </div>

        {/* Group Count Widget */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[220px] shadow-xl">
          <span className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
            Total de Grupos (N: 1 - 200)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGroupCountChange(numGroups - 1)}
              disabled={numGroups <= 1}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="1"
              max="200"
              value={numGroups}
              onChange={(e) => handleGroupCountChange(e.target.value)}
              className="w-20 h-10 bg-slate-950 border border-[#ff5e1e]/50 text-center font-mono text-2xl font-black text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5e1e]"
            />

            <button
              type="button"
              onClick={() => handleGroupCountChange(numGroups + 1)}
              disabled={numGroups >= 200}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[11px] font-semibold text-[#00f2fe] mt-2 flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5" /> {numGroups * 4} Jugadores en Total
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-1">
        <div className="text-xs text-slate-400">
          * Ingresa los nombres de los 4 jugadores de cada grupo
        </div>

        <button
          type="button"
          onClick={handleClearAllNames}
          className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-slate-400 hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Limpiar Todos los Campos
        </button>
      </div>

      {/* Search and Pagination Toolbar */}
      {groupsData.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar etiqueta o jugador..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredGroups.length)} de {filteredGroups.length} Grupos
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedGroups.map((group) => (
            <div key={group.index} className="glass-panel p-5 relative group hover:border-[#ff5e1e]/40 transition-all">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ff5e1e]/20 border border-[#ff5e1e]/40 text-[#ff8c53] font-bold flex items-center justify-center text-xs font-mono">
                    {group.label}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{group.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">4 Jugadores (Todos vs Todos)</p>
                  </div>
                </div>
                <span className="badge badge-orange text-[10px]">Grupo {group.label}</span>
              </div>

              <div className="space-y-3">
                {group.players.map((player, pIdx) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-mono font-bold text-slate-500 text-center">
                      J{pIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => handlePlayerNameChange(group.index, pIdx, e.target.value)}
                      placeholder={`Jugador ${group.index * 4 + pIdx + 1}`}
                      className="input-field text-sm font-medium focus:border-[#ff5e1e]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Página Anterior
            </button>
            <span className="text-xs font-mono font-bold text-slate-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1 disabled:opacity-40"
            >
              Página Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-center pb-12">
          <button
            type="submit"
            className="btn btn-primary text-base py-4 px-10 rounded-xl font-bold shadow-2xl pulse-glow flex items-center gap-3"
          >
            <Play className="w-5 h-5 fill-current" /> Generar Fase de Grupos ({numGroups * 6} Partidos)
          </button>
        </div>
      </form>
    </div>
  );
}
