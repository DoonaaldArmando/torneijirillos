import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import PhaseSetup from "./components/PhaseSetup";
import PhaseGroupStage from "./components/PhaseGroupStage";
import PhaseKnockoutBracket from "./components/PhaseKnockoutBracket";
import TournamentDashboard from "./components/TournamentDashboard";
import {
  generateGroupMatches,
  generateKnockoutBracket,
  syncBracketWithGroupResults,
  updateBracketNodeWinner,
  updatePlayerNameInTournament,
  generateInitialGroups,
  getGroupLabel
} from "./utils/tournamentLogic";
import {
  getAllTournamentsSummary,
  getTournamentById,
  saveTournament,
  deleteTournament,
  duplicateTournament,
  exportAllData,
  importData
} from "./services/storage";

export default function App() {
  // Navigation View State: 'dashboard' | 'tournament_detail'
  const [currentView, setCurrentView] = useState("dashboard");
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tournament Object State
  const [activeTournament, setActiveTournament] = useState(null);

  // Cargar lista inicial de resúmenes de torneos al montar
  const refreshSummaries = useCallback(async () => {
    try {
      const list = await getAllTournamentsSummary();
      setSummaries(list);
    } catch (err) {
      console.error("Error al cargar resúmenes de torneos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSummaries();
  }, [refreshSummaries]);

  // Persistir cambios del torneo activo
  const updateAndPersistActiveTournament = async (updatedData) => {
    setActiveTournament(updatedData);
    try {
      await saveTournament(updatedData);
      refreshSummaries();
    } catch (err) {
      console.error("Error al guardar torneo activo:", err);
    }
  };

  // 1. Abrir un torneo existente
  const handleOpenTournament = async (id) => {
    try {
      const tourney = await getTournamentById(id);
      if (tourney) {
        setActiveTournament(tourney);
        setCurrentView("tournament_detail");
      }
    } catch (err) {
      alert("Error al cargar el torneo seleccionado.");
    }
  };

  // 2. Crear un torneo nuevo
  const handleCreateTournament = async (name, numGroups = 3) => {
    const newId = "t_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const initialGroups = generateInitialGroups(numGroups);

    const newTournament = {
      id: newId,
      name: name || `Torneo Tenis de Mesa #${summaries.length + 1}`,
      createdAt: now,
      updatedAt: now,
      status: "setup",
      numGroups,
      groups: initialGroups,
      matchesMap: {},
      bracketData: { rounds: [], totalRounds: 0, numByes: 0 }
    };

    await updateAndPersistActiveTournament(newTournament);
    setCurrentView("tournament_detail");
  };

  // 3. Duplicar torneo
  const handleDuplicateTournament = async (id) => {
    try {
      await duplicateTournament(id);
      refreshSummaries();
    } catch (err) {
      alert("Error al duplicar el torneo.");
    }
  };

  // 4. Eliminar torneo
  const handleDeleteTournament = async (id) => {
    try {
      await deleteTournament(id);
      if (activeTournament && activeTournament.id === id) {
        setActiveTournament(null);
        setCurrentView("dashboard");
      }
      refreshSummaries();
    } catch (err) {
      alert("Error al eliminar el torneo.");
    }
  };

  // 5. Exportar todos los datos a archivo JSON
  const handleExportAll = async () => {
    try {
      const jsonString = await exportAllData();
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `torneijirillos_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar la base de datos de torneos.");
    }
  };

  // 6. Importar datos desde JSON
  const handleImportData = async (jsonString) => {
    try {
      const count = await importData(jsonString);
      alert(`¡Éxito! Se importaron ${count} torneos correctamente.`);
      refreshSummaries();
    } catch (err) {
      alert(`Error al importar datos: ${err.message}`);
    }
  };

  // Phase 1 -> Phase 2 Transition (Generar Fase de Grupos)
  const handleGenerateGroupStage = (groupsData) => {
    if (!activeTournament) return;
    const initialMatches = generateGroupMatches(groupsData, activeTournament.matchesMap || {});

    let updatedBracket = activeTournament.bracketData;
    if (updatedBracket && updatedBracket.rounds && updatedBracket.rounds.length > 0) {
      // Sincronizar los nombres en las rondas existentes del cuadro
      const updatedRounds = updatedBracket.rounds.map((round) =>
        round.map((node) => {
          let p1 = node.player1;
          let p2 = node.player2;
          let winner = node.winner;

          groupsData.forEach((g) => {
            g.players.forEach((p) => {
              if (p1 && p1.id === p.id) p1 = { ...p1, name: p.name };
              if (p2 && p2.id === p.id) p2 = { ...p2, name: p.name };
              if (winner && winner.id === p.id) winner = { ...winner, name: p.name };
            });
          });

          return { ...node, player1: p1, player2: p2, winner };
        })
      );
      updatedBracket = syncBracketWithGroupResults(
        { ...updatedBracket, rounds: updatedRounds },
        groupsData,
        initialMatches
      );
    }

    const updated = {
      ...activeTournament,
      numGroups: groupsData.length,
      groups: groupsData,
      matchesMap: initialMatches,
      bracketData: updatedBracket,
      status: "groups"
    };

    updateAndPersistActiveTournament(updated);
  };

  // Actualizar el nombre de un jugador dinámicamente durante el torneo
  const handleUpdatePlayerName = (playerId, newName) => {
    if (!activeTournament) return;
    const updated = updatePlayerNameInTournament(activeTournament, playerId, newName);
    updateAndPersistActiveTournament(updated);
  };

  // Añadir un nuevo grupo dinámicamente a un torneo en curso
  const handleAddGroup = (customPlayerNames = null) => {
    if (!activeTournament) return;

    const currentGroups = activeTournament.groups || [];
    const newGroupIndex = currentGroups.length;
    const newGroupLabel = getGroupLabel(newGroupIndex);

    const players = [];
    for (let p = 0; p < 4; p++) {
      const pName =
        customPlayerNames && customPlayerNames[p] && customPlayerNames[p].trim()
          ? customPlayerNames[p].trim()
          : `Jugador ${newGroupIndex * 4 + p + 1}`;

      players.push({
        id: `g${newGroupIndex}_p${p}`,
        name: pName,
        groupIndex: newGroupIndex,
        playerIndex: p
      });
    }

    const newGroup = {
      index: newGroupIndex,
      label: newGroupLabel,
      name: `Grupo ${newGroupLabel}`,
      players
    };

    const updatedGroups = [...currentGroups, newGroup];
    const updatedMatchesMap = generateGroupMatches(updatedGroups, activeTournament.matchesMap || {});

    let updatedBracket = activeTournament.bracketData;
    if (updatedBracket && updatedBracket.rounds && updatedBracket.rounds.length > 0) {
      updatedBracket = syncBracketWithGroupResults(updatedBracket, updatedGroups, updatedMatchesMap);
    }

    const updated = {
      ...activeTournament,
      numGroups: updatedGroups.length,
      groups: updatedGroups,
      matchesMap: updatedMatchesMap,
      bracketData: updatedBracket
    };

    updateAndPersistActiveTournament(updated);
  };

  // Update a single match result in Group Stage
  const handleUpdateMatchScore = (groupId, matchId, score1, score2, winnerId, setDetails = null) => {
    if (!activeTournament) return;

    const prevMatchesMap = activeTournament.matchesMap || {};
    const gList = prevMatchesMap[groupId] || [];
    const updatedList = gList.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        score1,
        score2,
        completed: true,
        winnerId,
        setDetails
      };
    });

    const newMatchesMap = { ...prevMatchesMap, [groupId]: updatedList };

    // Sincronizar cuadro eliminatorio si ya existe
    let updatedBracket = activeTournament.bracketData;
    if (updatedBracket && updatedBracket.rounds && updatedBracket.rounds.length > 0) {
      updatedBracket = syncBracketWithGroupResults(updatedBracket, activeTournament.groups, newMatchesMap);
    }

    const updated = {
      ...activeTournament,
      matchesMap: newMatchesMap,
      bracketData: updatedBracket
    };

    updateAndPersistActiveTournament(updated);
  };

  // Phase 2 -> Phase 3 Transition / Early Knockout Generation
  const handleGenerateKnockout = () => {
    if (!activeTournament) return;

    let updatedBracket = activeTournament.bracketData;
    if (updatedBracket && updatedBracket.rounds && updatedBracket.rounds.length > 0) {
      updatedBracket = syncBracketWithGroupResults(updatedBracket, activeTournament.groups, activeTournament.matchesMap);
    } else {
      updatedBracket = generateKnockoutBracket(activeTournament.groups, activeTournament.matchesMap);
    }

    const updated = {
      ...activeTournament,
      bracketData: updatedBracket,
      status: activeTournament.status === "completed" ? "completed" : "knockout"
    };

    updateAndPersistActiveTournament(updated);
  };

  // Update a matchup winner in Knockout Bracket
  const handleUpdateBracketWinner = (targetRound, targetMatchIndex, winnerId, score1, score2, setDetails = null) => {
    if (!activeTournament || !activeTournament.bracketData) return;

    const updatedRounds = updateBracketNodeWinner(
      activeTournament.bracketData.rounds,
      targetRound,
      targetMatchIndex,
      winnerId,
      score1,
      score2,
      setDetails
    );

    const updatedBracket = { ...activeTournament.bracketData, rounds: updatedRounds };

    // Comprobar si la final tiene un ganador completado
    let isFinished = false;
    if (updatedRounds.length > 0) {
      const finalMatch = updatedRounds[updatedRounds.length - 1][0];
      if (finalMatch && finalMatch.completed && finalMatch.winner) {
        isFinished = true;
      }
    }

    const updated = {
      ...activeTournament,
      bracketData: updatedBracket,
      status: isFinished ? "completed" : "knockout"
    };

    updateAndPersistActiveTournament(updated);
  };

  // Auto-simulate entire remaining Knockout Bracket
  const handleAutoSimulateBracket = () => {
    if (!activeTournament || !activeTournament.bracketData) return;

    const prev = activeTournament.bracketData;
    let currentRounds = JSON.parse(JSON.stringify(prev.rounds));
    const presets = [[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]];

    for (let r = 1; r <= prev.totalRounds; r++) {
      const roundNodes = currentRounds[r - 1];
      roundNodes.forEach((node, mIdx) => {
        if (
          !node.completed &&
          node.player1 &&
          node.player2 &&
          !node.player1.isPlaceholder &&
          !node.player2.isPlaceholder &&
          !node.player2.isBye
        ) {
          const preset = presets[Math.floor(Math.random() * presets.length)];
          const s1 = preset[0];
          const s2 = preset[1];
          const winnerId = s1 > s2 ? node.player1.id : node.player2.id;
          currentRounds = updateBracketNodeWinner(currentRounds, r, mIdx, winnerId, s1, s2);
        }
      });
    }

    const updatedBracket = { ...prev, rounds: currentRounds };
    const updated = {
      ...activeTournament,
      bracketData: updatedBracket,
      status: "completed"
    };

    updateAndPersistActiveTournament(updated);
  };

  // Reset current active tournament
  const handleReset = () => {
    if (!activeTournament) return;
    const initialGroups = generateInitialGroups(activeTournament.numGroups || activeTournament.groups.length || 3);
    const updated = {
      ...activeTournament,
      status: "setup",
      groups: initialGroups,
      matchesMap: {},
      bracketData: { rounds: [], totalRounds: 0, numByes: 0 }
    };

    updateAndPersistActiveTournament(updated);
  };

  // Computed Values for active tournament
  const groups = activeTournament?.groups || [];
  const matchesMap = activeTournament?.matchesMap || {};
  const bracketData = activeTournament?.bracketData || { rounds: [], totalRounds: 0, numByes: 0 };
  const phase = activeTournament?.status || "setup";

  const totalGroupMatches = groups.length * 6;
  const groupMatchesCompleted = Object.values(matchesMap).reduce(
    (acc, list) => acc + (list ? list.filter((m) => m.completed).length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-[#ff5e1e] selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        tournamentName={activeTournament?.name}
        phase={phase}
        totalGroups={groups.length}
        groupMatchesCompleted={groupMatchesCompleted}
        totalGroupMatches={totalGroupMatches}
        onReset={handleReset}
        onSelectPhase={(targetPhase) => {
          if (activeTournament) {
            updateAndPersistActiveTournament({ ...activeTournament, status: targetPhase });
          }
        }}
        onGenerateKnockout={handleGenerateKnockout}
        onGoToDashboard={() => setCurrentView("dashboard")}
      />

      {/* Main Dynamic View */}
      <main className="pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#ff5e1e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentView === "dashboard" ? (
          <TournamentDashboard
            summaries={summaries}
            onOpenTournament={handleOpenTournament}
            onCreateTournament={handleCreateTournament}
            onDuplicateTournament={handleDuplicateTournament}
            onDeleteTournament={handleDeleteTournament}
            onExportAll={handleExportAll}
            onImportData={handleImportData}
          />
        ) : (
          <>
            {phase === "setup" && (
              <PhaseSetup
                initialNumGroups={groups.length || activeTournament?.numGroups || 3}
                initialGroups={groups}
                onGenerateGroupStage={handleGenerateGroupStage}
              />
            )}

            {(phase === "groups" || phase === "completed") && (
              <PhaseGroupStage
                groups={groups}
                matchesMap={matchesMap}
                tournamentName={activeTournament?.name}
                onUpdateMatchScore={handleUpdateMatchScore}
                onUpdatePlayerName={handleUpdatePlayerName}
                onGenerateKnockout={handleGenerateKnockout}
                onAddGroup={handleAddGroup}
              />
            )}

            {phase === "knockout" && (
              <PhaseKnockoutBracket
                bracketData={bracketData}
                onUpdateWinner={handleUpdateBracketWinner}
                onAutoSimulateBracket={handleAutoSimulateBracket}
                onReset={handleReset}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <p>torneijirillos Pro • Gestor de Torneos Simultáneos de Tenis de Mesa</p>
      </footer>
    </div>
  );
}
