import React, { useState, useMemo, useRef } from "react";
import {
  Trophy,
  Plus,
  Search,
  ArrowUpDown,
  Download,
  Upload,
  Copy,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FolderOpen
} from "lucide-react";

export default function TournamentDashboard({
  summaries,
  onOpenTournament,
  onCreateTournament,
  onDuplicateTournament,
  onDeleteTournament,
  onExportAll,
  onImportData
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'setup' | 'groups' | 'knockout' | 'completed'
  const [sortBy, setSortBy] = useState("updatedAt"); // 'updatedAt' | 'createdAt' | 'name'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // New Tournament Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNumGroups, setNewNumGroups] = useState(3);

  // Confirm Delete Modal State
  const [deletingId, setDeletingId] = useState(null);

  // File import ref
  const fileInputRef = useRef(null);

  // Calculate Statistics
  const stats = useMemo(() => {
    const total = summaries.length;
    let setup = 0;
    let active = 0;
    let completed = 0;
    let totalCompletedMatches = 0;

    summaries.forEach((t) => {
      if (t.status === "setup") setup++;
      else if (t.status === "completed") completed++;
      else active++;

      totalCompletedMatches += t.completedGroupMatches || 0;
    });

    return { total, setup, active, completed, totalCompletedMatches };
  }, [summaries]);

  // Filter & Sort
  const filteredSummaries = useMemo(() => {
    let result = [...summaries];

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.winnerName && t.winnerName.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // default updatedAt
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return result;
  }, [summaries, statusFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSummaries.length / ITEMS_PER_PAGE) || 1;
  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSummaries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSummaries, currentPage]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateTournament(newTitle.trim(), parseInt(newNumGroups) || 3);
    setShowCreateModal(false);
    setNewTitle("");
    setNewNumGroups(3);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (content) {
          onImportData(content);
        }
      } catch (err) {
        alert("Error al leer el archivo de respaldo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "setup":
        return (
          <span className="badge bg-slate-800 text-slate-300 border-slate-700">
            <Clock className="w-3 h-3 mr-1" /> Configuración
          </span>
        );
      case "groups":
        return (
          <span className="badge bg-[#ff5e1e]/20 text-[#ff8c53] border-[#ff5e1e]/40">
            <Layers className="w-3 h-3 mr-1" /> Fase de Grupos
          </span>
        );
      case "knockout":
        return (
          <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/40">
            <Trophy className="w-3 h-3 mr-1" /> Eliminatorias
          </span>
        );
      case "completed":
        return (
          <span className="badge bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Finalizado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Top Banner / Header */}
      <div className="glass-panel p-6 lg:p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-t-[#ff5e1e]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5e1e]/15 border border-[#ff5e1e]/30 text-[#ff8c53] text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" /> Panel de Gestión Multitorneo
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Gestión de <span className="title-gradient">Torneos Simultáneos</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Administra, crea y navega entre múltiples torneos de tenis de mesa guardados localmente de forma ultra-rápida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary py-3 px-5 rounded-xl font-bold shadow-xl flex items-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" /> Crear Nuevo Torneo
          </button>

          <button
            onClick={onExportAll}
            className="btn btn-secondary py-3 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Exportar todos los torneos a JSON"
          >
            <Download className="w-4 h-4 text-[#00f2fe]" /> Respaldo JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary py-3 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Importar torneos desde JSON"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> Importar JSON
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 flex flex-col items-center sm:items-start">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Torneos</span>
          <span className="text-3xl font-extrabold font-mono text-white mt-1">{stats.total}</span>
        </div>

        <div className="glass-panel p-4 flex flex-col items-center sm:items-start">
          <span className="text-xs font-bold uppercase text-[#ff8c53] tracking-wider">En Curso</span>
          <span className="text-3xl font-extrabold font-mono text-[#ff5e1e] mt-1">{stats.active}</span>
        </div>

        <div className="glass-panel p-4 flex flex-col items-center sm:items-start">
          <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Finalizados</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{stats.completed}</span>
        </div>

        <div className="glass-panel p-4 flex flex-col items-center sm:items-start">
          <span className="text-xs font-bold uppercase text-[#00f2fe] tracking-wider">Partidos Jugados</span>
          <span className="text-3xl font-extrabold font-mono text-[#00f2fe] mt-1">{stats.totalCompletedMatches}</span>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div className="glass-panel p-4 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o campeón..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field pl-9 text-xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 w-full lg:w-auto overflow-x-auto">
          {[
            { id: "all", label: "Todos" },
            { id: "setup", label: "Configuración" },
            { id: "groups", label: "Grupos" },
            { id: "knockout", label: "Eliminatorias" },
            { id: "completed", label: "Finalizados" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === f.id
                  ? "bg-[#ff5e1e] text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 text-xs font-medium w-full lg:w-auto justify-end">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#ff5e1e] text-xs font-medium"
          >
            <option value="updatedAt">Recientes primero</option>
            <option value="createdAt">Fecha de creación</option>
            <option value="name">Nombre (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredSummaries.length === 0 ? (
        <div className="glass-panel p-12 text-center my-8">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No se encontraron torneos</h3>
          <p className="text-xs text-slate-400 mb-6">
            {searchQuery || statusFilter !== "all"
              ? "Prueba cambiando el filtro o la búsqueda."
              : "Comienza creando tu primer torneo de tenis de mesa."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-xs py-2.5 px-5 rounded-xl font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Crear Torneo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedSummaries.map((t) => {
            const groupProgressPct =
              t.totalGroupMatches > 0
                ? Math.round((t.completedGroupMatches / t.totalGroupMatches) * 100)
                : 0;

            return (
              <div
                key={t.id}
                className="glass-panel p-5 flex flex-col justify-between group hover:border-[#ff5e1e]/40 transition-all shadow-lg hover:shadow-[#ff5e1e]/5"
              >
                <div>
                  {/* Card Top Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-bold text-white group-hover:text-[#ff763b] transition-colors line-clamp-1">
                      {t.name}
                    </h3>
                    {getStatusBadge(t.status)}
                  </div>

                  <div className="text-xs text-slate-400 font-mono space-y-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span>Grupos: {t.numGroups} ({t.numGroups * 4} jugadores)</span>
                    </div>

                    {t.winnerName && (
                      <div className="flex items-center gap-1.5 text-amber-400 font-sans font-bold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 mt-2">
                        <Award className="w-4 h-4" /> Campeón: {t.winnerName}
                      </div>
                    )}
                  </div>

                  {/* Group Progress Bar */}
                  {t.totalGroupMatches > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>Fase de Grupos</span>
                        <span>{t.completedGroupMatches} / {t.totalGroupMatches} Partidos ({groupProgressPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-[#ff5e1e] to-[#00f2fe] h-full transition-all duration-300"
                          style={{ width: `${groupProgressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Act: {new Date(t.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDuplicateTournament(t.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Duplicar Torneo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingId(t.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                      title="Eliminar Torneo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenTournament(t.id)}
                      className="btn btn-primary text-xs py-1.5 px-3 font-bold flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Abrir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Toolbar */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
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
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal: Create Tournament */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card max-w-md animate-fade-in">
            <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ff5e1e]" /> Nuevo Torneo
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Torneo Verano 2026 - Categoría A"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Número de Grupos (1 - 200)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={newNumGroups}
                    onChange={(e) => setNewNumGroups(e.target.value)}
                    className="input-field text-sm font-mono"
                  />
                  <span className="text-xs text-[#00f2fe] font-mono whitespace-nowrap">
                    {parseInt(newNumGroups || 0) * 4} Jugadores
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs px-5 py-2 font-bold"
                >
                  Crear e Iniciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Eliminar Torneo?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Esta acción no se puede deshacer. Se borrarán todos los grupos, marcadores y resultados de este torneo.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="btn btn-secondary px-5"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteTournament(deletingId);
                  setDeletingId(null);
                }}
                className="btn btn-danger px-5 font-bold"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
