#!/usr/bin/env node
"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const DATA_FILE = process.env.LEADERBOARD_FILE
  ? path.resolve(process.env.LEADERBOARD_FILE)
  : path.join(__dirname, "leaderboard.json");

const MAX_BODY_SIZE = 64 * 1024;

function nowIso() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizePlayerId(raw) {
  return String(raw || "")
    .trim()
    .replace(/[^A-Za-z0-9._:-]/g, "")
    .slice(0, 72);
}

function sanitizePlayerName(raw, fallback = "") {
  const cleaned = String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z0-9À-ÿ _.-]/g, "")
    .trim();
  return cleaned.slice(0, 18) || fallback;
}

function nameKey(name) {
  return sanitizePlayerName(name, "").toLocaleLowerCase("it-IT");
}

function sanitizeScore(raw) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function sanitizeDifficulty(raw) {
  const parsed = Number.parseInt(raw, 10);
  const safe = Number.isFinite(parsed) ? parsed : 1;
  return clamp(safe, 1, 5);
}

function createEmptyStore() {
  return {
    version: 1,
    updatedAt: nowIso(),
    players: [],
  };
}

function normalizePlayer(record) {
  const id = sanitizePlayerId(record?.playerId);
  const name = sanitizePlayerName(record?.name, "");
  if (!id || !name) return null;

  const bestScore = sanitizeScore(record.bestScore);
  const gamesPlayed = Math.max(0, Math.round(Number(record.gamesPlayed) || 0));
  return {
    playerId: id,
    name,
    nameKey: nameKey(name),
    bestScore,
    bestDifficulty: sanitizeDifficulty(record.bestDifficulty),
    gamesPlayed,
    lastScore: sanitizeScore(record.lastScore),
    lastDifficulty: sanitizeDifficulty(record.lastDifficulty),
    lastWon: Boolean(record.lastWon),
    createdAt: String(record.createdAt || nowIso()),
    updatedAt: String(record.updatedAt || nowIso()),
  };
}

function normalizeStore(store) {
  const normalized = createEmptyStore();
  const seenIds = new Set();
  const seenNames = new Set();

  const rawPlayers = Array.isArray(store?.players) ? store.players : [];
  for (const raw of rawPlayers) {
    const player = normalizePlayer(raw);
    if (!player) continue;
    if (seenIds.has(player.playerId) || seenNames.has(player.nameKey)) continue;
    seenIds.add(player.playerId);
    seenNames.add(player.nameKey);
    normalized.players.push(player);
  }

  normalized.updatedAt = String(store?.updatedAt || nowIso());
  return normalized;
}

function sortPlayers(players) {
  return [...players].sort((a, b) => {
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    return String(a.updatedAt).localeCompare(String(b.updatedAt));
  });
}

function toPublicPlayer(record) {
  return {
    name: record.name,
    bestScore: record.bestScore,
    bestDifficulty: record.bestDifficulty,
    gamesPlayed: record.gamesPlayed,
    updatedAt: record.updatedAt,
  };
}

function getTopPlayer(store) {
  const sorted = sortPlayers(store.players);
  if (!sorted.length) return null;
  return toPublicPlayer(sorted[0]);
}

function getLeaderboardPayload(store) {
  const sorted = sortPlayers(store.players);
  return {
    topPlayer: sorted.length ? toPublicPlayer(sorted[0]) : null,
    top10: sorted.slice(0, 10).map(toPublicPlayer),
    totalPlayers: sorted.length,
    updatedAt: store.updatedAt,
  };
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const empty = createEmptyStore();
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2));
  }
}

async function loadStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createEmptyStore();
  }
}

async function saveStore(store) {
  const safe = normalizeStore(store);
  safe.updatedAt = nowIso();

  const tempFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(safe, null, 2));
  await fs.rename(tempFile, DATA_FILE);
  return safe;
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertUniqueName(store, requestedNameKey, playerId) {
  const conflict = store.players.find(
    (player) => player.nameKey === requestedNameKey && player.playerId !== playerId
  );

  if (conflict) {
    throw createHttpError(409, `Nome gia in uso: ${conflict.name}`);
  }
}

function upsertPlayer(store, playerId, rawName) {
  const name = sanitizePlayerName(rawName, "");
  if (!name) {
    throw createHttpError(400, "Nome giocatore non valido.");
  }

  const normalizedName = nameKey(name);
  assertUniqueName(store, normalizedName, playerId);

  const now = nowIso();
  let player = store.players.find((entry) => entry.playerId === playerId);

  if (!player) {
    player = {
      playerId,
      name,
      nameKey: normalizedName,
      bestScore: 0,
      bestDifficulty: 1,
      gamesPlayed: 0,
      lastScore: 0,
      lastDifficulty: 1,
      lastWon: false,
      createdAt: now,
      updatedAt: now,
    };
    store.players.push(player);
    return player;
  }

  player.name = name;
  player.nameKey = normalizedName;
  player.updatedAt = now;
  return player;
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Needed for HTTPS origins calling localhost (Private Network Access preflight).
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(createHttpError(413, "Payload troppo grande."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        reject(createHttpError(400, "Body JSON non valido."));
      }
    });

    req.on("error", () => {
      reject(createHttpError(400, "Errore lettura body."));
    });
  });
}

async function handleRegister(req, res) {
  const body = await readJsonBody(req);
  const playerId = sanitizePlayerId(body.playerId);
  if (!playerId) {
    throw createHttpError(400, "playerId obbligatorio.");
  }

  const store = await loadStore();
  const player = upsertPlayer(store, playerId, body.name);
  const saved = await saveStore(store);

  sendJson(res, 200, {
    ok: true,
    player: toPublicPlayer(player),
    topPlayer: getTopPlayer(saved),
  });
}

async function handleScore(req, res) {
  const body = await readJsonBody(req);
  const playerId = sanitizePlayerId(body.playerId);
  if (!playerId) {
    throw createHttpError(400, "playerId obbligatorio.");
  }

  const score = sanitizeScore(body.score);
  const difficulty = sanitizeDifficulty(body.difficulty);
  const won = Boolean(body.won);

  const store = await loadStore();
  const player = upsertPlayer(store, playerId, body.name);
  player.gamesPlayed += 1;
  player.lastScore = score;
  player.lastDifficulty = difficulty;
  player.lastWon = won;
  player.updatedAt = nowIso();

  if (score > player.bestScore) {
    player.bestScore = score;
    player.bestDifficulty = difficulty;
  }

  const saved = await saveStore(store);
  sendJson(res, 200, {
    ok: true,
    player: toPublicPlayer(player),
    topPlayer: getTopPlayer(saved),
  });
}

async function handleLeaderboard(_req, res) {
  const store = await loadStore();
  sendJson(res, 200, {
    ok: true,
    ...getLeaderboardPayload(store),
  });
}

async function route(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(res, 200, { ok: true, status: "up", file: DATA_FILE });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/leaderboard") {
    await handleLeaderboard(req, res);
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/register") {
    await handleRegister(req, res);
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/score") {
    await handleScore(req, res);
    return;
  }

  sendJson(res, 404, { ok: false, error: "Endpoint non trovato." });
}

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    const status = Number(error?.status) || 500;
    const message = status >= 500 ? "Errore interno server." : String(error.message || "Errore richiesta.");
    sendJson(res, status, { ok: false, error: message });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Leaderboard API pronta su http://${HOST}:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`File classifica: ${DATA_FILE}`);
});
