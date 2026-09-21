/**
 * Funciones de utilidad para la Gestión del Torneo de Tenis de Mesa - torneijirillos
 */

export function getGroupLabel(index) {
  let label = "";
  let idx = index;
  while (idx >= 0) {
    label = String.fromCharCode(65 + (idx % 26)) + label;
    idx = Math.floor(idx / 26) - 1;
  }
  return label;
}

/**
 * Genera la estructura inicial de jugadores para N grupos
 */
export function generateInitialGroups(numGroups) {
  const groups = [];
  for (let g = 0; g < numGroups; g++) {
    const groupName = `Grupo ${getGroupLabel(g)}`;
    const players = [];
    for (let p = 0; p < 4; p++) {
      players.push({
        id: `g${g}_p${p}`,
        name: "", // campo limpio para entrada manual
        groupIndex: g,
        playerIndex: p
      });
    }
    groups.push({
      index: g,
      label: getGroupLabel(g),
      name: groupName,
      players
    });
  }
  return groups;
}

/**
 * Genera los 6 enfrentamientos todos contra todos para cada grupo:
 * Partido 1: P1 vs P2
 * Partido 2: P3 vs P4
 * Partido 3: P1 vs P3
 * Partido 4: P2 vs P4
 * Partido 5: P1 vs P4
 * Partido 6: P2 vs P3
 */
export function generateGroupMatches(groups) {
  const matchesByGroup = {};

  groups.forEach((group) => {
    const p = group.players;
    const matchups = [
      { p1: p[0], p2: p[1], matchNum: 1 },
      { p1: p[2], p2: p[3], matchNum: 2 },
      { p1: p[0], p2: p[2], matchNum: 3 },
      { p1: p[1], p2: p[3], matchNum: 4 },
      { p1: p[0], p2: p[3], matchNum: 5 },
      { p1: p[1], p2: p[2], matchNum: 6 }
    ];

    matchesByGroup[group.index] = matchups.map((m, idx) => ({
      id: `G${group.index}_M${idx + 1}`,
      groupId: group.index,
      matchNum: m.matchNum,
      player1: m.p1,
      player2: m.p2,
      score1: null,
      score2: null,
      completed: false,
      winnerId: null,
      setDetails: null
    }));
  });

  return matchesByGroup;
}

/**
 * Calcula la Tabla de Posiciones para un Grupo
 * Puntos: Victoria = 2, Derrota = 1
 * Desempate 1 (2 empatados): Ganador del enfrentamiento directo
 * Desempate 2 (3 empatados): Ratio de Sets (ganados / perdidos) solo entre los partidos de los empatados
 */
export function calculateGroupStandings(group, matches) {
  const stats = {};

  group.players.forEach((player) => {
    stats[player.id] = {
      player,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDiff: 0,
      gameRatio: 0,
      tieBreakerReason: null
    };
  });

  matches.forEach((m) => {
    if (m.completed && m.score1 !== null && m.score2 !== null) {
      const p1 = stats[m.player1.id];
      const p2 = stats[m.player2.id];

      if (p1 && p2) {
        p1.played += 1;
        p2.played += 1;

        p1.gamesWon += m.score1;
        p1.gamesLost += m.score2;
        p2.gamesWon += m.score2;
        p2.gamesLost += m.score1;

        if (m.score1 > m.score2) {
          p1.wins += 1;
          p1.points += 2;
          p2.losses += 1;
          p2.points += 1;
        } else if (m.score2 > m.score1) {
          p2.wins += 1;
          p2.points += 2;
          p1.losses += 1;
          p1.points += 1;
        }
      }
    }
  });

  // Ratios globales de sets
  Object.values(stats).forEach((st) => {
    st.gameDiff = st.gamesWon - st.gamesLost;
    st.gameRatio = st.gamesLost === 0 ? st.gamesWon * 100 : st.gamesWon / st.gamesLost;
  });

  const playerList = Object.values(stats);

  // Agrupar por puntos
  const pointsMap = {};
  playerList.forEach((p) => {
    if (!pointsMap[p.points]) pointsMap[p.points] = [];
    pointsMap[p.points].push(p);
  });

  const sortedPoints = Object.keys(pointsMap)
    .map(Number)
    .sort((a, b) => b - a);

  let finalStandings = [];

  sortedPoints.forEach((pts) => {
    const bucket = pointsMap[pts];

    if (bucket.length === 1) {
      finalStandings.push(bucket[0]);
    } else if (bucket.length === 2) {
      // Desempate 1: Enfrentamiento Directo
      const [pA, pB] = bucket;
      const h2hMatch = matches.find(
        (m) =>
          m.completed &&
          ((m.player1.id === pA.player.id && m.player2.id === pB.player.id) ||
            (m.player1.id === pB.player.id && m.player2.id === pA.player.id))
      );

      if (h2hMatch && h2hMatch.winnerId) {
        if (h2hMatch.winnerId === pA.player.id) {
          pA.tieBreakerReason = `Victoria directa sobre ${pB.player.name}`;
          pB.tieBreakerReason = `Derrota directa ante ${pA.player.name}`;
          finalStandings.push(pA, pB);
        } else {
          pB.tieBreakerReason = `Victoria directa sobre ${pA.player.name}`;
          pA.tieBreakerReason = `Derrota directa ante ${pB.player.name}`;
          finalStandings.push(pB, pA);
        }
      } else {
        bucket.sort((a, b) => b.gameRatio - a.gameRatio || b.gameDiff - a.gameDiff);
        finalStandings.push(...bucket);
      }
    } else if (bucket.length === 3) {
      // Desempate 2: Ratio de sets entre los 3 empatados
      const tiedPlayerIds = new Set(bucket.map((b) => b.player.id));
      const miniStats = {};

      bucket.forEach((b) => {
        miniStats[b.player.id] = {
          playerStat: b,
          tbGamesWon: 0,
          tbGamesLost: 0,
          tbRatio: 0
        };
      });

      matches.forEach((m) => {
        if (
          m.completed &&
          tiedPlayerIds.has(m.player1.id) &&
          tiedPlayerIds.has(m.player2.id)
        ) {
          const st1 = miniStats[m.player1.id];
          const st2 = miniStats[m.player2.id];
          if (st1 && st2) {
            st1.tbGamesWon += m.score1;
            st1.tbGamesLost += m.score2;
            st2.tbGamesWon += m.score2;
            st2.tbGamesLost += m.score1;
          }
        }
      });

      bucket.forEach((b) => {
        const ms = miniStats[b.player.id];
        ms.tbRatio = ms.tbGamesLost === 0 ? ms.tbGamesWon * 100 : ms.tbGamesWon / ms.tbGamesLost;
        b.tieBreakerReason = `Empate triple: Ratio de sets (${ms.tbGamesWon}/${ms.tbGamesLost} = ${ms.tbRatio.toFixed(2)})`;
      });

      bucket.sort((a, b) => {
        const msA = miniStats[a.player.id];
        const msB = miniStats[b.player.id];
        if (Math.abs(msA.tbRatio - msB.tbRatio) > 0.001) {
          return msB.tbRatio - msA.tbRatio;
        }
        return b.gameRatio - a.gameRatio || b.gameDiff - a.gameDiff;
      });

      finalStandings.push(...bucket);
    } else {
      bucket.sort((a, b) => b.gameRatio - a.gameRatio || b.gameDiff - a.gameDiff);
      finalStandings.push(...bucket);
    }
  });

  return finalStandings.map((st, idx) => ({
    ...st,
    rank: idx + 1
  }));
}

/**
 * Genera el Cuadro Eliminatorio Directo
 */
export function generateKnockoutBracket(groups, groupMatchesMap) {
  const groupStandingsMap = {};
  groups.forEach((g) => {
    groupStandingsMap[g.index] = calculateGroupStandings(g, groupMatchesMap[g.index] || []);
  });

  const firsts = [];
  const seconds = [];

  groups.forEach((g) => {
    const standings = groupStandingsMap[g.index];
    if (standings && standings.length >= 2) {
      const winner = standings[0];
      const runnerUp = standings[1];

      firsts.push({
        ...winner.player,
        groupLabel: g.label,
        groupRank: 1,
        points: winner.points,
        gameRatio: winner.gameRatio,
        gameDiff: winner.gameDiff,
        gamesWon: winner.gamesWon
      });

      seconds.push({
        ...runnerUp.player,
        groupLabel: g.label,
        groupRank: 2,
        points: runnerUp.points,
        gameRatio: runnerUp.gameRatio,
        gameDiff: runnerUp.gameDiff,
        gamesWon: runnerUp.gamesWon
      });
    }
  });

  firsts.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (Math.abs(b.gameRatio - a.gameRatio) > 0.001) return b.gameRatio - a.gameRatio;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gamesWon - a.gamesWon;
  });

  seconds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (Math.abs(b.gameRatio - a.gameRatio) > 0.001) return b.gameRatio - a.gameRatio;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gamesWon - a.gamesWon;
  });

  const N = groups.length;
  const totalAdvancing = 2 * N;

  let bracketSize = 2;
  while (bracketSize < totalAdvancing) {
    bracketSize *= 2;
  }

  const numByes = bracketSize - totalAdvancing;

  const byePlayerIds = new Set();
  const byesList = [];

  for (let i = 0; i < numByes; i++) {
    if (i < firsts.length) {
      byePlayerIds.add(firsts[i].id);
      byesList.push({ type: "BYE", for1stPlaceId: firsts[i].id });
    } else {
      const secIdx = i - firsts.length;
      if (secIdx < seconds.length) {
        byePlayerIds.add(seconds[secIdx].id);
        byesList.push({ type: "BYE", for2ndPlaceId: seconds[secIdx].id });
      }
    }
  }

  const topHalfFirsts = [];
  const bottomHalfFirsts = [];

  firsts.forEach((f, idx) => {
    if (idx % 2 === 0) {
      topHalfFirsts.push(f);
    } else {
      bottomHalfFirsts.push(f);
    }
  });

  const topHalfGroupLabels = new Set(topHalfFirsts.map((f) => f.groupLabel));

  const topHalfSeconds = seconds.filter((s) => !topHalfGroupLabels.has(s.groupLabel));
  const bottomHalfSeconds = seconds.filter((s) => topHalfGroupLabels.has(s.groupLabel));

  const buildHalfMatchups = (firstsList, secondsList) => {
    const halfMatchups = [];
    const availableSeconds = [...secondsList];

    firstsList.forEach((firstPlayer) => {
      if (byePlayerIds.has(firstPlayer.id)) {
        halfMatchups.push({
          player1: firstPlayer,
          player2: { id: `bye_${firstPlayer.id}`, name: "PASE DIRECTO (BYE)", isBye: true },
          isByeMatch: true
        });
      } else {
        let oppIdx = availableSeconds.findIndex((s) => s.groupLabel !== firstPlayer.groupLabel);
        if (oppIdx === -1 && availableSeconds.length > 0) {
          oppIdx = 0;
        }

        if (oppIdx !== -1) {
          const opponent = availableSeconds.splice(oppIdx, 1)[0];
          halfMatchups.push({
            player1: firstPlayer,
            player2: opponent,
            isByeMatch: false
          });
        } else {
          halfMatchups.push({
            player1: firstPlayer,
            player2: { id: `bye_${firstPlayer.id}`, name: "PASE DIRECTO (BYE)", isBye: true },
            isByeMatch: true
          });
        }
      }
    });

    while (availableSeconds.length >= 2) {
      const p1 = availableSeconds.shift();
      const p2 = availableSeconds.shift();
      halfMatchups.push({ player1: p1, player2: p2, isByeMatch: false });
    }
    if (availableSeconds.length === 1) {
      const p1 = availableSeconds.shift();
      halfMatchups.push({
        player1: p1,
        player2: { id: `bye_${p1.id}`, name: "PASE DIRECTO (BYE)", isBye: true },
        isByeMatch: true
      });
    }

    return halfMatchups;
  };

  let topHalfMatchups = [];
  let bottomHalfMatchups = [];

  if (bracketSize === 2) {
    topHalfMatchups = [
      {
        player1: firsts[0] || { id: "p1", name: "Jugador 1" },
        player2: firsts[1] || seconds[0] || { id: "p2", name: "Jugador 2" },
        isByeMatch: false
      }
    ];
  } else {
    topHalfMatchups = buildHalfMatchups(topHalfFirsts, topHalfSeconds);
    bottomHalfMatchups = buildHalfMatchups(bottomHalfFirsts, bottomHalfSeconds);
  }

  const round1Matchups = [...topHalfMatchups, ...bottomHalfMatchups];

  const totalRounds = Math.log2(bracketSize);
  const rounds = [];

  // Ronda 1
  const round1Nodes = round1Matchups.map((m, idx) => {
    const isBye = m.isByeMatch || m.player2?.isBye;
    const winner = isBye ? m.player1 : null;
    return {
      id: `r1_m${idx}`,
      round: 1,
      matchIndex: idx,
      player1: m.player1,
      player2: m.player2,
      score1: isBye ? 3 : null,
      score2: isBye ? 0 : null,
      winner: winner,
      completed: isBye,
      isByeMatch: isBye
    };
  });

  rounds.push(round1Nodes);

  for (let r = 2; r <= totalRounds; r++) {
    const prevRound = rounds[r - 2];
    const currentRoundNodes = [];
    const numMatches = prevRound.length / 2;

    for (let m = 0; m < numMatches; m++) {
      const parent1 = prevRound[m * 2];
      const parent2 = prevRound[m * 2 + 1];

      const p1 = parent1.winner;
      const p2 = parent2.winner;

      let winner = null;
      let completed = false;
      let score1 = null;
      let score2 = null;

      if (p1 && p2 && (p1.isBye || p2.isBye)) {
        winner = p1.isBye ? p2 : p1;
        completed = true;
        score1 = p1.isBye ? 0 : 3;
        score2 = p1.isBye ? 3 : 0;
      }

      currentRoundNodes.push({
        id: `r${r}_m${m}`,
        round: r,
        matchIndex: m,
        player1: p1,
        player2: p2,
        score1: score1,
        score2: score2,
        winner: winner,
        completed: completed,
        isByeMatch: false,
        parentMatchIds: [parent1.id, parent2.id]
      });
    }

    rounds.push(currentRoundNodes);
  }

  return {
    bracketSize,
    totalRounds,
    numByes,
    rounds
  };
}

export function updateBracketNodeWinner(rounds, targetRound, targetMatchIndex, winnerId, score1 = 3, score2 = 0, setDetails = null) {
  const newRounds = JSON.parse(JSON.stringify(rounds));
  const currentRoundIndex = targetRound - 1;
  const matchNode = newRounds[currentRoundIndex][targetMatchIndex];

  if (!matchNode || !matchNode.player1 || !matchNode.player2) {
    return newRounds;
  }

  let winnerObj = null;
  if (winnerId === matchNode.player1.id) {
    winnerObj = matchNode.player1;
    matchNode.score1 = score1;
    matchNode.score2 = score2;
  } else if (winnerId === matchNode.player2.id) {
    winnerObj = matchNode.player2;
    matchNode.score1 = score1;
    matchNode.score2 = score2;
  }

  matchNode.setDetails = setDetails;
  matchNode.winner = winnerObj;
  matchNode.completed = Boolean(winnerObj);

  if (currentRoundIndex + 1 < newRounds.length) {
    const nextRoundIndex = currentRoundIndex + 1;
    const nextMatchIndex = Math.floor(targetMatchIndex / 2);
    const isPlayer1InNextMatch = targetMatchIndex % 2 === 0;

    const nextMatchNode = newRounds[nextRoundIndex][nextMatchIndex];
    if (nextMatchNode) {
      if (isPlayer1InNextMatch) {
        nextMatchNode.player1 = winnerObj;
      } else {
        nextMatchNode.player2 = winnerObj;
      }

      if (
        nextMatchNode.winner &&
        nextMatchNode.winner.id !== nextMatchNode.player1?.id &&
        nextMatchNode.winner.id !== nextMatchNode.player2?.id
      ) {
        nextMatchNode.winner = null;
        nextMatchNode.completed = false;
        nextMatchNode.score1 = null;
        nextMatchNode.score2 = null;
      }
    }
  }

  return newRounds;
}
