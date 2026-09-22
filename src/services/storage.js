/**
 * Service de Almacenamiento IndexedDB para torneijirillos Pro
 * Soporta almacenamiento masivo de 300+ torneos con IndexedDB y fallback a localStorage.
 */

const DB_NAME = "torneijirillos_db";
const DB_VERSION = 1;
const STORE_NAME = "tournaments";

function openDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null); // Fallback to localStorage if IndexedDB is unavailable
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("name", "name", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.warn("IndexedDB open error, falling back to localStorage:", event.target.error);
      resolve(null);
    };
  });
}

// LocalStorage Fallback Helpers
const LOCAL_STORAGE_KEY = "torneijirillos_tournaments_backup";

function getLocalStorageTournaments() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading localStorage:", e);
    return [];
  }
}

function saveLocalStorageTournaments(list) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Error writing to localStorage:", e);
  }
}

/**
 * Obtiene el resumen de todos los torneos (para el Dashboard)
 */
export async function getAllTournamentsSummary() {
  const db = await openDB();

  if (!db) {
    const list = getLocalStorageTournaments();
    return list.map((t) => extractSummary(t));
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result || [];
      const summaries = list.map((t) => extractSummary(t));
      // Ordenar por updatedAt descendente por defecto
      summaries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      resolve(summaries);
    };

    request.onerror = (err) => {
      console.error("Error in getAllTournamentsSummary:", err);
      reject(err);
    };
  });
}

/**
 * Extrae un objeto resumen ligero de un torneo
 */
function extractSummary(t) {
  const totalGroupMatches = (t.groups ? t.groups.length : 0) * 6;
  const completedGroupMatches = t.matchesMap
    ? Object.values(t.matchesMap).reduce(
        (acc, list) => acc + (list ? list.filter((m) => m.completed).length : 0),
        0
      )
    : 0;

  let winnerName = null;
  if (t.bracketData && t.bracketData.rounds && t.bracketData.rounds.length > 0) {
    const lastRound = t.bracketData.rounds[t.bracketData.rounds.length - 1];
    if (lastRound && lastRound.length > 0 && lastRound[0].winner) {
      winnerName = lastRound[0].winner.name;
    }
  }

  return {
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    status: t.status || "setup",
    numGroups: t.numGroups || (t.groups ? t.groups.length : 0),
    totalGroupMatches,
    completedGroupMatches,
    winnerName
  };
}

/**
 * Obtiene el torneo completo por ID
 */
export async function getTournamentById(id) {
  const db = await openDB();

  if (!db) {
    const list = getLocalStorageTournaments();
    return list.find((t) => t.id === id) || null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Guarda o actualiza un torneo
 */
export async function saveTournament(tournament) {
  const updatedTournament = {
    ...tournament,
    updatedAt: new Date().toISOString()
  };

  const db = await openDB();

  if (!db) {
    const list = getLocalStorageTournaments();
    const idx = list.findIndex((t) => t.id === updatedTournament.id);
    if (idx >= 0) {
      list[idx] = updatedTournament;
    } else {
      list.push(updatedTournament);
    }
    saveLocalStorageTournaments(list);
    return updatedTournament;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(updatedTournament);

    request.onsuccess = () => {
      resolve(updatedTournament);
    };

    request.onerror = (err) => {
      console.error("Error saving tournament to IndexedDB:", err);
      reject(err);
    };
  });
}

/**
 * Elimina un torneo por ID
 */
export async function deleteTournament(id) {
  const db = await openDB();

  if (!db) {
    const list = getLocalStorageTournaments();
    const filtered = list.filter((t) => t.id !== id);
    saveLocalStorageTournaments(filtered);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Duplica un torneo existente
 */
export async function duplicateTournament(id) {
  const original = await getTournamentById(id);
  if (!original) return null;

  const newId = "t_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const copy = JSON.parse(JSON.stringify(original));
  copy.id = newId;
  copy.name = `${original.name} (Copia)`;
  copy.createdAt = now;
  copy.updatedAt = now;

  await saveTournament(copy);
  return copy;
}

/**
 * Exporta todos los torneos a JSON
 */
export async function exportAllData() {
  const db = await openDB();

  if (!db) {
    return JSON.stringify(getLocalStorageTournaments(), null, 2);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(JSON.stringify(request.result || [], null, 2));
    };

    request.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Importa torneos desde un string JSON
 */
export async function importData(jsonData) {
  const tournaments = JSON.parse(jsonData);
  if (!Array.isArray(tournaments)) {
    throw new Error("El archivo de respaldo no contiene una lista válida de torneos.");
  }

  const db = await openDB();

  if (!db) {
    saveLocalStorageTournaments(tournaments);
    return tournaments.length;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    let count = 0;
    tournaments.forEach((t) => {
      if (t.id && t.name) {
        store.put(t);
        count++;
      }
    });

    tx.oncomplete = () => {
      resolve(count);
    };

    tx.onerror = (err) => {
      reject(err);
    };
  });
}
