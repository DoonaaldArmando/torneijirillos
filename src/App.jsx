import React, { useState } from "react";
import Navbar from "./components/Navbar";
import PhaseSetup from "./components/PhaseSetup";
import PhaseGroupStage from "./components/PhaseGroupStage";
import PhaseKnockoutBracket from "./components/PhaseKnockoutBracket";
import {
  generateGroupMatches,
  generateKnockoutBracket,
  updateBracketNodeWinner
} from "./utils/tournamentLogic";

export default function App() {
  const [phase, setPhase] = useState("setup"); // 'setup' | 'groups' | 'knockout'
  const [groups, setGroups] = useState([]);
  const [matchesMap, setMatchesMap] = useState({});
  const [bracketData, setBracketData] = useState({ rounds: [], totalRounds: 0, numByes: 0 });

  // Phase 1 -> Phase 2 Transition
  const handleGenerateGroupStage = (groupsData) => {
    setGroups(groupsData);
    const initialMatches = generateGroupMatches(groupsData);
    setMatchesMap(initialMatches);
    setPhase("groups");
  };

  // Update a single match result in Group Stage
  const handleUpdateMatchScore = (groupId, matchId, score1, score2, winnerId, setDetails = null) => {
    setMatchesMap((prev) => {
      const gList = prev[groupId] || [];
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
      return { ...prev, [groupId]: updatedList };
    });
  };

  // Phase 2 -> Phase 3 Transition
  const handleGenerateKnockout = () => {
    const bracket = generateKnockoutBracket(groups, matchesMap);
    setBracketData(bracket);
    setPhase("knockout");
  };

  // Update a matchup winner in Knockout Bracket
  const handleUpdateBracketWinner = (targetRound, targetMatchIndex, winnerId, score1, score2, setDetails = null) => {
    setBracketData((prev) => {
      const updatedRounds = updateBracketNodeWinner(
        prev.rounds,
        targetRound,
        targetMatchIndex,
        winnerId,
        score1,
        score2,
        setDetails
      );
      return { ...prev, rounds: updatedRounds };
    });
  };

  // Auto-simulate entire remaining Knockout Bracket
  const handleAutoSimulateBracket = () => {
    setBracketData((prev) => {
      let currentRounds = JSON.parse(JSON.stringify(prev.rounds));
      const presets = [[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]];

      for (let r = 1; r <= prev.totalRounds; r++) {
        const roundNodes = currentRounds[r - 1];
        roundNodes.forEach((node, mIdx) => {
          if (!node.completed && node.player1 && node.player2 && !node.player2.isBye) {
            const preset = presets[Math.floor(Math.random() * presets.length)];
            const s1 = preset[0];
            const s2 = preset[1];
            const winnerId = s1 > s2 ? node.player1.id : node.player2.id;
            currentRounds = updateBracketNodeWinner(currentRounds, r, mIdx, winnerId, s1, s2);
          }
        });
      }

      return { ...prev, rounds: currentRounds };
    });
  };

  // Reset entire tournament state
  const handleReset = () => {
    setPhase("setup");
    setGroups([]);
    setMatchesMap({});
    setBracketData({ rounds: [], totalRounds: 0, numByes: 0 });
  };

  // Count total completed group matches
  const totalGroupMatches = groups.length * 6;
  const groupMatchesCompleted = Object.values(matchesMap).reduce(
    (acc, list) => acc + list.filter((m) => m.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-[#ff5e1e] selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        phase={phase}
        totalGroups={groups.length}
        groupMatchesCompleted={groupMatchesCompleted}
        totalGroupMatches={totalGroupMatches}
        onReset={handleReset}
      />

      {/* Dynamic Views */}
      <main className="pb-16">
        {phase === "setup" && (
          <PhaseSetup onGenerateGroupStage={handleGenerateGroupStage} />
        )}

        {phase === "groups" && (
          <PhaseGroupStage
            groups={groups}
            matchesMap={matchesMap}
            onUpdateMatchScore={handleUpdateMatchScore}
            onGenerateKnockout={handleGenerateKnockout}
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
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <p>torneijirillos Pro • Sistema de Gestión de Torneos de Tenis de Mesa</p>
      </footer>
    </div>
  );
}
