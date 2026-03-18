(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const energyEl = document.getElementById("energy");
  const timeEl = document.getElementById("time");
  const difficultyHudEl = document.getElementById("difficulty-hud");
  const scoreEl = document.getElementById("score");
  const playerNameHudEl = document.getElementById("player-name-hud");
  const playerPortraitCanvas = document.getElementById("player-portrait");
  const portraitCtx = playerPortraitCanvas ? playerPortraitCanvas.getContext("2d") : null;

  const overlay = document.getElementById("state-overlay");
  const panel = overlay.querySelector(".panel");
  const nameInputEl = document.getElementById("player-name-input");
  const difficultySelectEl = document.getElementById("difficulty-select");
  const serverLeaderboardTopEl = document.getElementById("server-leaderboard-top");
  const serverLeaderboardStatusEl = document.getElementById("server-leaderboard-status");
  const genderMaleBtn = document.getElementById("gender-male-btn");
  const genderFemaleBtn = document.getElementById("gender-female-btn");
  const enemyLabelInputs = {
    boss: document.getElementById("enemy-boss-input"),
    bigBoss: document.getElementById("enemy-bigboss-input"),
    colleague1: document.getElementById("enemy-colleague-1-input"),
    colleague2: document.getElementById("enemy-colleague-2-input"),
    colleague3: document.getElementById("enemy-colleague-3-input"),
    client: document.getElementById("enemy-client-input"),
  };

  const touchUI = document.getElementById("touch-ui");
  const touchPad = document.getElementById("touch-pad");
  const touchKnob = document.getElementById("touch-knob");
  const touchAttack = document.getElementById("touch-attack");
  const touchJump = document.getElementById("touch-jump");
  const musicToggleBtn = document.getElementById("music-toggle");
  const weaponToggleBtn = document.getElementById("weapon-toggle");

  const START_HOUR = 9;
  const SHIFT_HOURS = 8;
  const SHIFT_MINUTES = SHIFT_HOURS * 60;
  const MAX_ENERGY = 10;
  const GRAVITY = 1650;
  const MUSIC_FILE = "assets/buggyboy-amiga500.ogg";
  const PLAYER_NAME_COOKIE = "buddyboy_player_name";
  const PLAYER_ID_COOKIE = "buddyboy_player_id";
  const COOKIE_DAYS = 365;
  const API_URL_PARAM = new URLSearchParams(window.location.search).get("api");
  const SERVER_API_BASE = (API_URL_PARAM || window.BUDDYBOY_API_BASE || "/api")
    .replace(/\/+$/, "");
  const SERVER_REQUEST_TIMEOUT_MS = 1800;
  const DIFFICULTY_LEVELS = {
    1: { label: "1 - Facile", speedMul: 0.9, hpMul: 0.9, spawnMul: 0.82, scoreMul: 0.9, cooldownMul: 1.08 },
    2: { label: "2 - Standard", speedMul: 1, hpMul: 1, spawnMul: 1, scoreMul: 1, cooldownMul: 1 },
    3: { label: "3 - Intensa", speedMul: 1.12, hpMul: 1.12, spawnMul: 1.12, scoreMul: 1.12, cooldownMul: 0.94 },
    4: { label: "4 - Hardcore", speedMul: 1.24, hpMul: 1.24, spawnMul: 1.28, scoreMul: 1.28, cooldownMul: 0.88 },
    5: { label: "5 - Nightmare", speedMul: 1.38, hpMul: 1.38, spawnMul: 1.45, scoreMul: 1.45, cooldownMul: 0.8 },
  };
  const CHIP_STEP_MS = 155;
  const CHIP_LEAD_PATTERN_A = [
    72, 74, 76, 79, 76, 74, 72, null,
    74, 76, 77, 81, 79, 77, 76, null,
    72, 74, 76, 79, 81, 79, 76, 74,
    72, 69, 71, 72, 74, 76, 74, null,
  ];
  const CHIP_LEAD_PATTERN_B = [
    76, 79, 81, 84, 81, 79, 76, null,
    74, 76, 79, 81, 79, 76, 74, null,
    72, 74, 76, 79, 81, 84, 81, 79,
    76, 74, 72, 71, 72, 74, 76, null,
  ];
  const CHIP_BASS_PATTERN_A = [
    48, null, 48, null, 45, null, 45, null,
    41, null, 41, null, 43, null, 43, null,
    48, null, 48, null, 45, null, 45, null,
    41, null, 43, null, 45, null, 43, null,
  ];
  const CHIP_BASS_PATTERN_B = [
    50, null, 50, null, 47, null, 47, null,
    43, null, 43, null, 45, null, 45, null,
    50, null, 50, null, 47, null, 47, null,
    43, null, 45, null, 47, null, 45, null,
  ];
  const CHIP_CHORD_PATTERN_A = [
    [48, 52, 55],
    [45, 48, 52],
    [41, 45, 48],
    [43, 47, 50],
  ];
  const CHIP_CHORD_PATTERN_B = [
    [50, 53, 57],
    [47, 50, 54],
    [43, 47, 50],
    [45, 48, 52],
  ];
  const CHIP_ARP_STEPS = [0, 4, 7, 12, 7, 4];

  const ENEMY_RULES = {
    boss: { w: 52, h: 82, speed: 72, hp: 3, points: 320, label: "CAPO" },
    bigBoss: { w: 156, h: 246, speed: 78, hp: 30, points: 4200, label: "BIG BOSS" },
    colleague: { w: 46, h: 76, speed: 108, hp: 2, points: 160, label: "COLLEGA" },
    commercial: { w: 48, h: 78, speed: 124, hp: 2, points: 210, label: "COMMERCIALI" },
    client: { w: 46, h: 74, speed: 96, hp: 2, points: 190, label: "CLIENTI" },
    meeting: { w: 70, h: 58, speed: 58, hp: 2, points: 220, label: "MEETING 100+" },
    mail: { w: 42, h: 28, speed: 135, hp: 1, points: 90, label: "MAIL", airborne: true },
    hacker: { w: 48, h: 78, speed: 84, hp: 2, points: 260, label: "HACKER" },
    budget: { w: 64, h: 56, speed: 92, hp: 3, points: 300, label: "BUDGET" },
    warroom: { w: 76, h: 70, speed: 0, hp: 2, points: 260, label: "WAR ROOM", hazard: true },
  };
  const ENEMY_LABEL_FALLBACKS = {
    colleague1: "COLLEGA 1",
    colleague2: "COLLEGA 2",
    colleague3: "COLLEGA 3",
  };
  const enemyLabelProfile = {};
  for (const type in ENEMY_RULES) {
    enemyLabelProfile[type] = ENEMY_RULES[type].label;
  }
  for (const type in ENEMY_LABEL_FALLBACKS) {
    enemyLabelProfile[type] = ENEMY_LABEL_FALLBACKS[type];
  }

  const PROJECTILE_STYLES = {
    packet: { w: 18, h: 10, ttl: 4.2, color: "#87f4ff", gravity: 0 },
    invite: { w: 24, h: 24, ttl: 3.6, color: "#93b9ff", gravity: 220 },
    mailShot: { w: 24, h: 16, ttl: 2.5, color: "#dff6ff", gravity: 0 },
    meetingShot: { w: 28, h: 28, ttl: 2.9, color: "#8fbcff", gravity: 190 },
  };

  const PLAYER_FIRE_MODES = {
    mailShot: { label: "MAIL", cooldown: 0.2, speed: 560, rise: -90, damage: 1 },
    meetingShot: { label: "RIUNIONE", cooldown: 0.34, speed: 410, rise: -180, damage: 2 },
  };

  const PLAYER_LOOKS = {
    male: {
      skin: "#ffd6be",
      hair: "#18253a",
      torso: "#4be0ff",
      pants: "#1e5a77",
      accent: "#7cffc7",
      hairLong: false,
      feminine: false,
    },
    female: {
      skin: "#ffdcca",
      hair: "#6c3d2d",
      torso: "#ff74b0",
      pants: "#5a4f93",
      accent: "#ffd3ea",
      hairLong: true,
      feminine: true,
    },
  };

  let level = buildLevel();
  let player = createPlayer();
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let popups = [];

  let gameState = "menu";
  let score = 0;
  let worldTime = 0;
  let playerFireMode = "mailShot";
  let finalBossSpawned = false;
  let finalBossDefeated = false;
  let finalBossNoticeCooldown = 0;
  const playerProfile = {
    name: "Antz",
    gender: "male",
  };
  let difficultyLevel = 3;
  let playerServerId = "";
  let serverApiOnline = false;
  let serverApiRetryAt = 0;
  let cachedTopPlayer = null;

  let lastFrame = performance.now();

  const keys = new Set();
  const HELD_INPUT_CODES = new Set(["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);
  let attackQueued = false;
  let jumpQueued = false;

  const touchMove = {
    active: false,
    pointerId: null,
    x: 0,
    y: 0,
  };

  const touchAttackState = {
    active: false,
    pointerId: null,
  };

  const touchJumpState = {
    active: false,
    pointerId: null,
  };
  let touchControlsEnabled = false;
  const touchModeQuery = window.matchMedia("(max-width: 900px), (pointer: coarse)");

  const camera = {
    x: 0,
    y: 0,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
  };

  const spawnDirector = {
    cooldown: 0.85,
    nextSide: 1,
  };

  const musicState = {
    enabled: true,
    started: false,
    externalReady: false,
    externalAudio: null,
    context: null,
    timer: null,
    step: 0,
    usingFallback: false,
  };

  function createPlayer() {
    return {
      x: level.startX,
      y: level.groundY - 82,
      w: 46,
      h: 82,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      walkSpeed: 210,
      runSpeed: 300,
      jumpPower: 840,
      energy: MAX_ENERGY,
      invuln: 0,
      attackCooldown: 0,
      attackTimer: 0,
      prevX: 0,
      prevY: 0,
    };
  }

  function sanitizePlayerName(raw, fallback = "Alex") {
    const cleaned = String(raw || "")
      .replace(/\s+/g, " ")
      .replace(/[^A-Za-z0-9À-ÿ _.-]/g, "")
      .trim();
    return cleaned.slice(0, 18) || fallback;
  }

  function sanitizeEnemyLabel(raw, fallback) {
    const cleaned = String(raw || "")
      .replace(/\s+/g, " ")
      .replace(/[^A-Za-z0-9À-ÿ _.+\-']/g, "")
      .trim();
    return cleaned.slice(0, 24) || fallback;
  }

  function readCookie(name) {
    const key = `${name}=`;
    const chunks = document.cookie ? document.cookie.split(";") : [];

    for (const rawChunk of chunks) {
      const chunk = rawChunk.trim();
      if (!chunk.startsWith(key)) continue;
      try {
        return decodeURIComponent(chunk.slice(key.length));
      } catch {
        return chunk.slice(key.length);
      }
    }

    return "";
  }

  function writeCookie(name, value, days = COOKIE_DAYS) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const encoded = encodeURIComponent(String(value ?? ""));
    document.cookie = `${name}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function createPlayerId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const rand = Math.random().toString(36).slice(2, 11);
    return `p-${Date.now().toString(36)}-${rand}`;
  }

  function ensurePlayerServerId() {
    const existing = readCookie(PLAYER_ID_COOKIE).trim();
    if (existing) return existing;

    const created = createPlayerId();
    writeCookie(PLAYER_ID_COOKIE, created);
    return created;
  }

  function rememberPlayerName() {
    const safeName = sanitizePlayerName(playerProfile.name);
    playerProfile.name = safeName;
    writeCookie(PLAYER_NAME_COOKIE, safeName);
  }

  function loadRememberedPlayerName() {
    const savedName = sanitizePlayerName(readCookie(PLAYER_NAME_COOKIE), "");
    if (!savedName) return;
    playerProfile.name = savedName;
    if (nameInputEl) {
      nameInputEl.value = savedName;
    }
  }

  function getDifficultyConfig() {
    return DIFFICULTY_LEVELS[difficultyLevel] || DIFFICULTY_LEVELS[3];
  }

  function setDifficultyLevel(rawLevel) {
    const parsed = Number.parseInt(rawLevel, 10);
    const normalized = clamp(Number.isFinite(parsed) ? parsed : 3, 1, 5);
    difficultyLevel = normalized;

    if (difficultySelectEl && String(difficultySelectEl.value) !== String(normalized)) {
      difficultySelectEl.value = String(normalized);
    }
    if (difficultyHudEl) {
      difficultyHudEl.textContent = `${difficultyLevel}/5`;
    }
  }

  function applyDifficultyFromSetup() {
    const selected = difficultySelectEl ? difficultySelectEl.value : difficultyLevel;
    setDifficultyLevel(selected);
  }

  function getTopPlayerText(topPlayer) {
    if (!topPlayer || !topPlayer.name) {
      return "Nessun record server disponibile.";
    }

    const topName = sanitizePlayerName(topPlayer.name, "Player");
    const topScore = Number.isFinite(topPlayer.bestScore) ? Math.max(0, Math.round(topPlayer.bestScore)) : 0;
    const topDifficulty = clamp(
      Number.parseInt(topPlayer.bestDifficulty, 10) || 1,
      1,
      5
    );
    return `${topName} • ${topScore} pt • Difficolta ${topDifficulty}/5`;
  }

  function setServerBoardStatus(message, tone = "info") {
    if (!serverLeaderboardStatusEl || !serverLeaderboardStatusEl.isConnected) return;

    const colorMap = {
      info: "#b7e9ff",
      ok: "#8df3bf",
      warn: "#ffd8a3",
      error: "#ff9f8e",
    };

    serverLeaderboardStatusEl.textContent = message;
    serverLeaderboardStatusEl.style.color = colorMap[tone] || colorMap.info;
  }

  function renderTopPlayer(topPlayer) {
    cachedTopPlayer = topPlayer || null;
    if (!serverLeaderboardTopEl || !serverLeaderboardTopEl.isConnected) return;
    serverLeaderboardTopEl.textContent = getTopPlayerText(cachedTopPlayer);
  }

  async function fetchJsonWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_REQUEST_TIMEOUT_MS);

    try {
      const requestOptions = { ...options, signal: controller.signal };
      requestOptions.headers = {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      };

      const response = await fetch(url, requestOptions);
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const message =
          (payload && (payload.error || payload.message)) ||
          `Errore API (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return payload || {};
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function refreshServerLeaderboard() {
    if (!serverLeaderboardTopEl || !serverLeaderboardStatusEl) return null;

    setServerBoardStatus("Caricamento classifica server...", "info");

    try {
      const data = await fetchJsonWithTimeout(`${SERVER_API_BASE}/leaderboard`, {
        method: "GET",
        cache: "no-store",
      });
      serverApiOnline = true;
      serverApiRetryAt = 0;
      renderTopPlayer(data.topPlayer || null);
      setServerBoardStatus("Server online: classifica attiva (nomi uguali consentiti).", "ok");
      return data;
    } catch (error) {
      serverApiOnline = false;
      serverApiRetryAt = Date.now() + 10000;
      renderTopPlayer(null);
      setServerBoardStatus(
        "Server classifica non raggiungibile: su GitHub Pages serve un backend esterno.",
        "warn"
      );
      return null;
    }
  }

  async function registerPlayerNameOnServer() {
    if (Date.now() < serverApiRetryAt) {
      return { ok: true, duplicate: false, offline: true };
    }

    const payload = {
      name: sanitizePlayerName(playerProfile.name),
      playerId: playerServerId,
    };

    try {
      const data = await fetchJsonWithTimeout(`${SERVER_API_BASE}/register`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      serverApiOnline = true;
      serverApiRetryAt = 0;
      const canonicalName = sanitizePlayerName(data.player?.name || payload.name);
      playerProfile.name = canonicalName;
      if (nameInputEl) {
        nameInputEl.value = canonicalName;
      }
      renderTopPlayer(data.topPlayer || cachedTopPlayer);
      setServerBoardStatus("Nome registrato sul server.", "ok");
      rememberPlayerName();
      return { ok: true, duplicate: false };
    } catch (error) {
      if (error.status === 409) {
        setServerBoardStatus(
          "Backend con regole vecchie: nome duplicato rifiutato, ma la partita parte comunque.",
          "warn"
        );
        return { ok: true, duplicate: false, offline: true };
      }

      serverApiOnline = false;
      serverApiRetryAt = Date.now() + 10000;
      setServerBoardStatus(
        "Server non disponibile ora: avvio in locale senza controllo nomi.",
        "warn"
      );
      return { ok: true, duplicate: false, offline: true };
    }
  }

  async function submitScoreOnServer(win) {
    if (!playerServerId) return;
    if (Date.now() < serverApiRetryAt) return;

    try {
      const data = await fetchJsonWithTimeout(`${SERVER_API_BASE}/score`, {
        method: "POST",
        body: JSON.stringify({
          playerId: playerServerId,
          name: playerProfile.name,
          score,
          difficulty: difficultyLevel,
          won: Boolean(win),
        }),
      });

      serverApiOnline = true;
      serverApiRetryAt = 0;
      renderTopPlayer(data.topPlayer || cachedTopPlayer);
      if (win) {
        setServerBoardStatus("Punteggio salvato sul server.", "ok");
      }
    } catch {
      serverApiOnline = false;
      serverApiRetryAt = Date.now() + 10000;
    }
  }

  function getPlayerLook() {
    return PLAYER_LOOKS[playerProfile.gender] || PLAYER_LOOKS.male;
  }

  function refreshGenderButtons() {
    const isMale = playerProfile.gender === "male";
    genderMaleBtn?.classList.toggle("active", isMale);
    genderFemaleBtn?.classList.toggle("active", !isMale);
  }

  function setPlayerGender(gender) {
    playerProfile.gender = gender === "female" ? "female" : "male";
    refreshGenderButtons();
    drawPlayerPortrait();
  }

  function applyProfileFromSetup() {
    if (nameInputEl) {
      playerProfile.name = sanitizePlayerName(nameInputEl.value);
      nameInputEl.value = playerProfile.name;
    }
    applyDifficultyFromSetup();
    applyEnemyLabelsFromSetup();
    refreshGenderButtons();
  }

  function applyEnemyLabelsFromSetup() {
    for (const type in enemyLabelInputs) {
      const inputEl = enemyLabelInputs[type];
      const fallback = getEnemyLabelFallback(type);

      if (!inputEl) {
        enemyLabelProfile[type] = sanitizeEnemyLabel(enemyLabelProfile[type], fallback);
        continue;
      }

      const finalLabel = sanitizeEnemyLabel(inputEl.value, fallback);
      enemyLabelProfile[type] = finalLabel;
      inputEl.value = finalLabel;
    }
  }

  function getEnemyLabelFallback(type) {
    return ENEMY_LABEL_FALLBACKS[type] || ENEMY_RULES[type]?.label || type.toUpperCase();
  }

  function getColleagueNamePool() {
    return ["colleague1", "colleague2", "colleague3"].map((slot) =>
      sanitizeEnemyLabel(enemyLabelProfile[slot], getEnemyLabelFallback(slot))
    );
  }

  function pickColleagueName() {
    const pool = getColleagueNamePool();
    if (!pool.length) return "COLLEGA";
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function getEnemyLabel(type) {
    const fallback = getEnemyLabelFallback(type);
    return sanitizeEnemyLabel(enemyLabelProfile[type], fallback);
  }

  function drawPlayerPortrait() {
    if (!portraitCtx || !playerPortraitCanvas) return;

    const look = getPlayerLook();
    const feminine = Boolean(look.feminine);
    const c = portraitCtx;
    const w = playerPortraitCanvas.width;
    const h = playerPortraitCanvas.height;
    const progress = getProgress();
    const smile = clamp(progress, 0, 1);
    const pulse = 0.5 + Math.sin(worldTime * 5.2) * 0.5;

    c.clearRect(0, 0, w, h);

    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, `hsl(${206 - smile * 24}, 66%, ${26 + smile * 9}%)`);
    bg.addColorStop(1, `hsl(${193 - smile * 14}, 61%, ${16 + smile * 11}%)`);
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    c.fillStyle = `rgba(164, 255, 208, ${0.06 + smile * 0.2})`;
    c.beginPath();
    c.arc(w * 0.5, h * 0.46, 24 + pulse * 2, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = `rgba(182, 243, 255, ${0.35 + smile * 0.35})`;
    c.lineWidth = 2;
    c.strokeRect(1, 1, w - 2, h - 2);

    c.fillStyle = look.torso;
    c.fillRect(10, h - 21, w - 20, 15);
    c.fillStyle = look.accent;
    c.fillRect(w - 20, h - 19, 8, 10);

    const headX = w * 0.5;
    const headY = h * 0.47;
    const headR = 16;

    c.fillStyle = look.skin;
    c.beginPath();
    c.arc(headX, headY, headR, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = look.hair;
    if (feminine) {
      // Top hair + fringe.
      c.beginPath();
      c.arc(headX - 1, headY - 6, 14.5, Math.PI * 1.02, Math.PI * 2.02);
      c.fill();
      c.beginPath();
      c.moveTo(headX - 11, headY - 4);
      c.quadraticCurveTo(headX - 2, headY - 12, headX + 8, headY - 4);
      c.lineTo(headX + 8, headY - 1);
      c.quadraticCurveTo(headX - 1, headY - 7, headX - 11, headY - 1);
      c.closePath();
      c.fill();

      // Long side hair to make female silhouette clear.
      c.fillRect(headX - 14, headY + 1, 8, 16);
      c.fillRect(headX + 6, headY + 1, 7, 16);
      c.beginPath();
      c.ellipse(headX - 11, headY + 14, 4.2, 5.8, 0.2, 0, Math.PI * 2);
      c.ellipse(headX + 10, headY + 14, 4.6, 6, -0.2, 0, Math.PI * 2);
      c.fill();

      // Small hair clip.
      c.fillStyle = "#ffd7ef";
      c.fillRect(headX + 3, headY - 7, 5, 2.6);
      c.fillStyle = look.hair;
    } else {
      c.beginPath();
      c.arc(headX - 1, headY - 5, 13.5, Math.PI * 1.02, Math.PI * 2.04);
      c.fill();
    }

    const eyeY = headY - 3.4;
    c.fillStyle = "#ffffff";
    c.fillRect(headX - 9, eyeY - 1.8, 4.4, 3.2);
    c.fillRect(headX + 4.6, eyeY - 1.8, 4.4, 3.2);
    c.fillStyle = "#132131";
    c.fillRect(headX - 7.8, eyeY - 1.1, 2.1, 2.1);
    c.fillRect(headX + 5.8, eyeY - 1.1, 2.1, 2.1);
    c.fillStyle = "rgba(255,255,255,0.7)";
    c.fillRect(headX - 7.3, eyeY - 0.9, 0.9, 0.9);
    c.fillRect(headX + 6.3, eyeY - 0.9, 0.9, 0.9);

    c.strokeStyle = feminine ? "#4b2f3f" : "#263342";
    c.lineWidth = feminine ? 1.8 : 1.5;
    c.beginPath();
    c.moveTo(headX - 9.2, eyeY - 2.7);
    c.quadraticCurveTo(headX - 6.9, eyeY - (feminine ? 4.2 : 3.4), headX - 4.4, eyeY - 2.7);
    c.moveTo(headX + 4.6, eyeY - 2.7);
    c.quadraticCurveTo(headX + 7.1, eyeY - (feminine ? 4.2 : 3.4), headX + 9.4, eyeY - 2.7);
    c.stroke();

    if (feminine) {
      c.strokeStyle = "#5b3c51";
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(headX - 4.6, eyeY - 2.8);
      c.lineTo(headX - 3.3, eyeY - 3.7);
      c.moveTo(headX + 10.1, eyeY - 2.8);
      c.lineTo(headX + 11.2, eyeY - 3.7);
      c.stroke();

      // Earrings.
      c.fillStyle = "#ffd7c0";
      c.beginPath();
      c.arc(headX - 13.2, headY + 6, 1.1, 0, Math.PI * 2);
      c.arc(headX + 13.2, headY + 6, 1.1, 0, Math.PI * 2);
      c.fill();
    }

    c.strokeStyle = "rgba(110, 82, 60, 0.35)";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(headX + 0.7, headY + 1.8);
    c.lineTo(headX + 2, headY + 3.9);
    c.stroke();

    const mouthY = headY + 8.2;
    const smileLift = 0.8 + smile * 6.2 + pulse * 0.6;
    if (feminine) {
      // Soft lips and smile for female portrait.
      c.strokeStyle = `rgba(192, 68, 108, ${0.62 + smile * 0.24})`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(headX - 6.4, mouthY + 0.1);
      c.quadraticCurveTo(headX, mouthY - smileLift * 0.56, headX + 6.4, mouthY + 0.1);
      c.stroke();

      c.fillStyle = `rgba(235, 115, 150, ${0.28 + smile * 0.24})`;
      c.beginPath();
      c.ellipse(headX, mouthY + 0.5, 4.7, 1.5, 0, 0, Math.PI * 2);
      c.fill();
    } else {
      c.strokeStyle = "#602e24";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(headX - 8, mouthY);
      c.quadraticCurveTo(headX, mouthY - smileLift, headX + 8, mouthY);
      c.stroke();
    }

    if (smile > 0.35 || feminine) {
      c.fillStyle = `rgba(255, 129, 144, ${0.14 + smile * 0.2})`;
      c.beginPath();
      c.arc(headX - 11, headY + 3, 2.8, 0, Math.PI * 2);
      c.arc(headX + 11, headY + 3, 2.8, 0, Math.PI * 2);
      c.fill();
    }

    c.fillStyle = `rgba(126, 255, 198, ${0.1 + smile * 0.55})`;
    c.beginPath();
    c.arc(w - 10, 10, 2 + smile * 2.2 + pulse * 0.5, 0, Math.PI * 2);
    c.fill();
  }

  function updateMusicButton() {
    if (!musicToggleBtn) return;

    const label = musicState.enabled ? "MUSICA: ON" : "MUSICA: OFF";
    musicToggleBtn.textContent = label;
  }

  function updateWeaponButton() {
    if (!weaponToggleBtn) return;
    const mode = PLAYER_FIRE_MODES[playerFireMode];
    weaponToggleBtn.textContent = `ARMA: ${mode?.label || "MAIL"}`;
  }

  function initMusicSystem() {
    try {
      const audio = new Audio(MUSIC_FILE);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.42;
      audio.playsInline = true;
      musicState.externalAudio = audio;

      audio.addEventListener("canplaythrough", () => {
        musicState.externalReady = true;
        if (musicState.enabled && musicState.started) {
          playMusic();
        } else {
          updateMusicButton();
        }
      });

      audio.addEventListener("error", () => {
        musicState.externalReady = false;
        if (musicState.enabled && musicState.started) {
          startFallbackMusic();
        } else {
          updateMusicButton();
        }
      });

      audio.load();
    } catch {
      musicState.externalReady = false;
    }

    updateMusicButton();
  }

  function ensureAudioContext() {
    if (!musicState.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      musicState.context = new Ctx();
    }

    if (musicState.context.state === "suspended") {
      musicState.context.resume().catch(() => {});
    }
    return musicState.context;
  }

  function unlockAudioFromGesture() {
    const ctxAudio = ensureAudioContext();
    if (ctxAudio) {
      if (ctxAudio.state === "suspended" || ctxAudio.state === "interrupted") {
        ctxAudio.resume().catch(() => {});
      }

      // iOS/Safari often needs a short gesture-driven sound to fully unlock output.
      try {
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        const now = ctxAudio.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        osc.frequency.setValueAtTime(220, now);
        osc.connect(gain);
        gain.connect(ctxAudio.destination);
        osc.start(now);
        osc.stop(now + 0.015);
      } catch {
        // Ignore unlock glitches: we'll still try normal playback.
      }
    }
  }

  function playChipVoice(ctxAudio, freq, duration, wave, gainValue, startAt = null) {
    const now = startAt === null ? ctxAudio.currentTime : startAt;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctxAudio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function midiToFreq(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  function playSfxNotes(notes, {
    step = 0.05,
    duration = 0.09,
    wave = "triangle",
    gain = 0.06,
    transpose = 0,
  } = {}) {
    if (!musicState.enabled) return;

    const ctxAudio = ensureAudioContext();
    if (!ctxAudio) return;

    const start = ctxAudio.currentTime + 0.001;
    notes.forEach((note, idx) => {
      if (note === null || note === undefined) return;
      const freq = midiToFreq(note + transpose);
      const t = start + idx * step;
      playChipVoice(ctxAudio, freq, duration, wave, gain, t);
    });
  }

  function playSfxEnemyDefeat() {
    playSfxNotes([72, 79, 84], { step: 0.035, duration: 0.08, wave: "triangle", gain: 0.055 });
  }

  function playSfxPlayerHit() {
    playSfxNotes([67, 62, 58], { step: 0.03, duration: 0.07, wave: "square", gain: 0.05 });
  }

  function playSfxPlayerDeath() {
    playSfxNotes([58, 54, 50, 45, 38], { step: 0.06, duration: 0.14, wave: "sawtooth", gain: 0.065 });
  }

  function playSfxWinJingle() {
    playSfxNotes([72, 76, 79, 84, 88], { step: 0.07, duration: 0.13, wave: "triangle", gain: 0.065 });
    playSfxNotes([60, 64, 67, 72], { step: 0.11, duration: 0.3, wave: "sine", gain: 0.03 });
  }

  function stopFallbackMusic() {
    if (musicState.timer) {
      clearInterval(musicState.timer);
      musicState.timer = null;
    }
    musicState.usingFallback = false;
  }

  function startFallbackMusic() {
    if (!musicState.enabled) return;

    const ctxAudio = ensureAudioContext();
    if (!ctxAudio) return;
    if (musicState.timer) return;
    const gainScale = 1.55;

    musicState.usingFallback = true;
    musicState.step = 0;
    musicState.timer = setInterval(() => {
      if (!musicState.enabled) return;

      const section = Math.floor(musicState.step / 32) % 2;
      const localStep = musicState.step % 32;
      const leadPattern = section === 0 ? CHIP_LEAD_PATTERN_A : CHIP_LEAD_PATTERN_B;
      const bassPattern = section === 0 ? CHIP_BASS_PATTERN_A : CHIP_BASS_PATTERN_B;
      const chordPattern = section === 0 ? CHIP_CHORD_PATTERN_A : CHIP_CHORD_PATTERN_B;

      const lead = leadPattern[localStep];
      const bass = bassPattern[localStep];
      const chordIndex = Math.floor(localStep / 8) % chordPattern.length;
      const barPos = localStep % 8;

      if (lead !== null) {
        playChipVoice(ctxAudio, midiToFreq(lead), 0.13, "triangle", 0.05 * gainScale);
      }
      if (bass !== null) {
        playChipVoice(ctxAudio, midiToFreq(bass), 0.19, "sine", 0.036 * gainScale);
      }

      if (lead !== null && barPos % 2 === 1) {
        const arpShift = CHIP_ARP_STEPS[barPos % CHIP_ARP_STEPS.length];
        playChipVoice(ctxAudio, midiToFreq(lead + arpShift / 2), 0.065, "square", 0.012 * gainScale);
      }

      if (barPos === 0) {
        const chord = chordPattern[chordIndex];
        for (const note of chord) {
          playChipVoice(ctxAudio, midiToFreq(note), 0.63, "triangle", 0.017 * gainScale);
        }
      }

      // Gentle rhythm layer
      playChipVoice(ctxAudio, 1450 + (barPos % 2) * 130, 0.02, "square", 0.0045 * gainScale);
      if (barPos === 0 || barPos === 4) {
        playChipVoice(ctxAudio, 92, 0.09, "sine", 0.02 * gainScale);
      }

      musicState.step += 1;
    }, CHIP_STEP_MS);

    updateMusicButton();
  }

  function stopMusic() {
    stopFallbackMusic();
    if (musicState.externalAudio) {
      musicState.externalAudio.pause();
    }
    updateMusicButton();
  }

  function playMusic() {
    musicState.started = true;
    if (!musicState.enabled) {
      stopMusic();
      return;
    }

    unlockAudioFromGesture();

    if (musicState.externalAudio && musicState.externalReady) {
      stopFallbackMusic();
      const audio = musicState.externalAudio;
      audio.loop = true;
      audio.volume = 0.42;

      const playAttempt = audio.play();
      if (playAttempt && typeof playAttempt.then === "function") {
        playAttempt
          .then(() => {
            musicState.usingFallback = false;
            updateMusicButton();
          })
          .catch(() => {
            startFallbackMusic();
          });
      } else {
        musicState.usingFallback = false;
        updateMusicButton();
      }
      return;
    }

    startFallbackMusic();
  }

  function toggleMusic(forceState) {
    if (typeof forceState === "boolean") {
      musicState.enabled = forceState;
    } else {
      musicState.enabled = !musicState.enabled;
    }

    if (musicState.enabled) {
      playMusic();
    } else {
      stopMusic();
    }
  }

  function buildLevel() {
    const width = 9000;
    const height = 1200;
    const groundY = 860;
    const startX = 140;
    const finishX = 8500;

    const platforms = [
      { x: -200, y: groundY, w: width + 700, h: 380, kind: "ground", solid: true },
    ];

    const signs = [
      { x: startX + 250, y: groundY - 300, text: "Nexi Payments" },
    ];
    const windows = [];
    const lamps = [];
    const columns = [];

    for (let x = 120; x < width; x += 340) {
      const w = 220 + (x % 2 === 0 ? 12 : -10);
      const h = 114 + ((x / 340) % 3 === 0 ? 8 : -6);
      windows.push({ x, y: 170, w, h });
    }

    for (let x = 260; x < width; x += 360) {
      lamps.push({
        x,
        y: 108 + Math.sin(x * 0.01) * 4,
      });
    }

    for (let x = 0; x < width; x += 620) {
      columns.push({
        x: x + 42,
        y: 104,
        w: 60,
        h: groundY - 104,
      });
    }

    let cursor = 420;
    const pickFurnitureKind = (progress) => {
      const r = Math.random();

      if (r < 0.2) return "desk";
      if (r < 0.35) return "server";
      if (r < 0.5) return "printer";
      if (r < 0.66) return "meetingTable";
      if (r < 0.8 - progress * 0.08) return "lounge";
      if (r < 0.9) return "locker";
      if (r < 0.96) return "shelf";
      return "plant";
    };

    const makeFurniture = (kind, x) => {
      if (kind === "desk") {
        const w = 120 + Math.random() * 64;
        const h = 56 + Math.random() * 30;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "server") {
        const w = 96 + Math.random() * 48;
        const h = 86 + Math.random() * 28;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "printer") {
        const w = 76 + Math.random() * 28;
        const h = 54 + Math.random() * 22;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "meetingTable") {
        const w = 164 + Math.random() * 80;
        const h = 58 + Math.random() * 22;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "lounge") {
        const w = 145 + Math.random() * 76;
        const h = 52 + Math.random() * 22;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "locker") {
        const w = 74 + Math.random() * 22;
        const h = 70 + Math.random() * 14;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      if (kind === "shelf") {
        const w = 110 + Math.random() * 44;
        const h = 66 + Math.random() * 16;
        return { x, y: groundY - h, w, h, kind, solid: true };
      }

      const w = 54 + Math.random() * 18;
      const h = 72 + Math.random() * 24;
      return { x, y: groundY - h, w, h, kind: "plant", solid: false };
    };

    while (cursor < finishX - 320) {
      const progress = clamp((cursor - startX) / (finishX - startX), 0, 1);
      const cluster = 1 + Math.floor(Math.random() * 3);
      let localX = cursor;

      for (let i = 0; i < cluster; i += 1) {
        const kind = pickFurnitureKind(progress);
        const block = makeFurniture(kind, localX);
        platforms.push(block);
        localX += block.w + 24 + Math.random() * 40;

        if ((kind === "meetingTable" || kind === "lounge") && Math.random() < 0.18) {
          const plant = makeFurniture("plant", block.x + block.w + 8);
          platforms.push(plant);
          localX += plant.w + 8;
        }

        if (Math.random() < 0.22) {
          const catW = Math.max(90, block.w * (0.75 + Math.random() * 0.58));
          const catX = block.x + Math.max(0, (block.w - catW) * 0.5);
          const clearance = 118 + Math.random() * 46;
          platforms.push({
            x: catX,
            y: block.y - clearance,
            w: catW,
            h: 20,
            kind: "catwalk",
            solid: true,
          });
        }

        if (Math.random() < 0.2) {
          const stairBaseX = block.x + block.w + 16;
          const shelfW = 100 + Math.random() * 28;
          platforms.push({
            x: stairBaseX,
            y: groundY - 72,
            w: shelfW,
            h: 16,
            kind: "shelfStep",
            solid: true,
          });
          platforms.push({
            x: stairBaseX + 104,
            y: groundY - 134,
            w: shelfW * 0.92,
            h: 16,
            kind: "shelfStep",
            solid: true,
          });
        }
      }

      cursor += cluster * 170 + 138 + Math.random() * 150;
    }

    const finishLaneStart = finishX - 980;
    const finishLaneEnd = finishX - 120;

    for (let i = platforms.length - 1; i >= 0; i -= 1) {
      const platform = platforms[i];
      if (!platform.solid || platform.kind === "ground") continue;

      const overlapsFinishLane =
        platform.x < finishLaneEnd && platform.x + platform.w > finishLaneStart;
      if (overlapsFinishLane) {
        platforms.splice(i, 1);
      }
    }

    platforms.push(
      { x: finishLaneStart + 90, y: groundY - 54, w: 130, h: 54, kind: "desk", solid: true },
      { x: finishLaneStart + 270, y: groundY - 110, w: 112, h: 16, kind: "shelfStep", solid: true },
      { x: finishLaneStart + 430, y: groundY - 54, w: 130, h: 54, kind: "desk", solid: true }
    );

    return {
      width,
      height,
      groundY,
      startX,
      finishX,
      platforms,
      signs,
      windows,
      lamps,
      columns,
    };
  }

  function resetGame() {
    level = buildLevel();
    player = createPlayer();
    enemies = buildEnemies();
    projectiles = [];
    particles = [];
    popups = [];
    score = 0;
    worldTime = 0;
    playerFireMode = "mailShot";
    finalBossSpawned = false;
    finalBossDefeated = false;
    finalBossNoticeCooldown = 0;

    keys.clear();
    attackQueued = false;
    jumpQueued = false;

    camera.x = 0;
    camera.y = getFixedCameraY();
    camera.shake = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;

    const diff = getDifficultyConfig();
    spawnDirector.cooldown = Math.max(0.35, 0.65 / diff.spawnMul);
    spawnDirector.nextSide = Math.random() < 0.5 ? -1 : 1;

    updateHud();
  }

  function buildEnemies() {
    const list = [];
    const diff = getDifficultyConfig();

    for (
      let x = 640;
      x < level.finishX - 620;
      x += Math.max(120, (220 + Math.random() * 220) / diff.spawnMul)
    ) {
      if (Math.random() < 0.14 / diff.spawnMul) continue;

      const progress = clamp((x - level.startX) / (level.finishX - level.startX), 0, 1);
      const type = pickEnemyType(progress);
      list.push(createEnemy(type, x));

      if (Math.random() < 0.1 * diff.spawnMul) {
        list.push(createEnemy("mail", x + 60 + Math.random() * 40));
      }
    }

    return list;
  }

  function pickEnemyType(progress) {
    const r = Math.random();

    if (r < 0.12 + progress * 0.06) return "boss";
    if (r < 0.3) return "colleague";
    if (r < 0.43) return "commercial";
    if (r < 0.55) return "client";
    if (r < 0.67) return "meeting";
    if (r < 0.8) return "mail";
    if (r < 0.9) return "hacker";
    if (r < 0.97) return "budget";
    return "warroom";
  }

  function createEnemy(type, x) {
    const rule = ENEMY_RULES[type];
    const diff = getDifficultyConfig();
    const useHigh = Math.random() < 0.28;
    const speed = rule.speed * diff.speedMul;
    const hp = Math.max(1, Math.round(rule.hp * diff.hpMul));

    let y;
    if (type === "mail") {
      y = level.groundY - 220 - Math.random() * 170;
    } else if (type === "bigBoss") {
      y = level.groundY - rule.h;
    } else {
      const surface = findSurfaceY(x, rule.w, useHigh);
      y = surface - rule.h;
    }

    return {
      type,
      x,
      y,
      w: rule.w,
      h: rule.h,
      vx: (Math.random() < 0.5 ? -1 : 1) * speed * 0.2,
      vy: 0,
      hp,
      maxHp: hp,
      speed,
      points: rule.points,
      label:
        type === "commercial" || type === "colleague"
          ? pickColleagueName()
          : getEnemyLabel(type),
      airborne: Boolean(rule.airborne),
      hazard: Boolean(rule.hazard),
      state: "alive",
      stun: 0,
      defeatTimer: 0,
      hitCooldown: 0,
      shotCooldown: (0.9 + Math.random() * 1.6) * diff.cooldownMul,
      specialCooldown: (1.1 + Math.random() * 2.2) * diff.cooldownMul,
      spawnX: x,
      patrolMin: x - (90 + Math.random() * 90),
      patrolMax: x + (90 + Math.random() * 90),
      dir: Math.random() < 0.5 ? -1 : 1,
      baseY: y,
      seed: Math.random() * Math.PI * 2,
      onGround: false,
      prevX: x,
      prevY: y,
    };
  }

  function countNearbyEnemies(radius = 980) {
    const playerCenter = player.x + player.w * 0.5;
    let count = 0;

    for (const enemy of enemies) {
      if (enemy.state === "defeated") continue;
      const enemyCenter = enemy.x + enemy.w * 0.5;
      if (Math.abs(enemyCenter - playerCenter) <= radius) {
        count += 1;
      }
    }

    return count;
  }

  function spawnEnemyFromSide(side) {
    const progress = getProgress();
    const roll = Math.random();
    let type = pickEnemyType(progress);

    if (roll < 0.14) type = "mail";
    if (roll > 0.95 && progress > 0.35) type = "boss";

    const rule = ENEMY_RULES[type];
    const spawnDistance = 460 + Math.random() * 260;
    const spawnX = clamp(
      player.x + side * spawnDistance,
      80,
      level.width - rule.w - 80
    );

    if (Math.abs(spawnX - player.x) < 210) return false;

    const enemy = createEnemy(type, spawnX);
    const playerCenter = player.x + player.w * 0.5;
    const enemyCenter = enemy.x + enemy.w * 0.5;
    const dirToPlayer = playerCenter >= enemyCenter ? 1 : -1;

    enemy.dir = dirToPlayer;
    enemy.hitCooldown = 0.5;
    enemy.patrolMin = enemy.x - (120 + Math.random() * 70);
    enemy.patrolMax = enemy.x + (120 + Math.random() * 70);

    if (enemy.airborne) {
      enemy.vx = enemy.dir * enemy.speed * (0.8 + Math.random() * 0.2);
      enemy.baseY = enemy.y;
    } else if (!enemy.hazard) {
      enemy.vx = enemy.dir * Math.max(70, enemy.speed * 0.72);
    }

    enemies.push(enemy);
    return true;
  }

  function updateEnemySpawns(dt) {
    if (finalBossSpawned && !finalBossDefeated) return;

    const diff = getDifficultyConfig();
    spawnDirector.cooldown -= dt;
    if (spawnDirector.cooldown > 0) return;

    const progress = getProgress();
    const nearby = countNearbyEnemies(980);
    const nearbyTarget = Math.max(3, Math.round((4 + Math.floor(progress * 3)) * diff.spawnMul));

    if (nearby >= nearbyTarget) {
      spawnDirector.cooldown = Math.max(
        0.18,
        (0.25 + Math.random() * 0.4) / diff.spawnMul
      );
      return;
    }

    const primarySide = spawnDirector.nextSide;
    const spawned = spawnEnemyFromSide(primarySide);
    spawnDirector.nextSide *= -1;

    const extraSpawnChance = clamp((0.08 + progress * 0.1) * diff.spawnMul, 0, 0.9);
    if (spawned && Math.random() < extraSpawnChance) {
      spawnEnemyFromSide(-primarySide);
    }

    const baseCooldown = (1.2 - progress * 0.35) / diff.spawnMul;
    spawnDirector.cooldown = Math.max(
      0.35,
      baseCooldown + (Math.random() * 0.75) / diff.spawnMul
    );
  }

  function spawnFinalBossIfNeeded(force = false) {
    if (finalBossSpawned || finalBossDefeated) return;
    if (!force && getProgress() < 0.84) return;

    const x = clamp(level.finishX - 340, 320, level.width - ENEMY_RULES.bigBoss.w - 120);
    const arenaStart = x - 320;
    const arenaEnd = level.finishX + 160;

    enemies = enemies.filter((enemy) => {
      if (enemy.type === "bigBoss") return true;
      if (enemy.state === "defeated") return false;
      return enemy.x + enemy.w < arenaStart || enemy.x > arenaEnd;
    });

    const boss = createEnemy("bigBoss", x);
    const diff = getDifficultyConfig();
    boss.dir = -1;
    boss.patrolMin = x - 210;
    boss.patrolMax = x + 120;
    boss.hitCooldown = 1.1;
    boss.shotCooldown = 1.4 * diff.cooldownMul;
    boss.specialCooldown = 1 * diff.cooldownMul;
    enemies.push(boss);

    finalBossSpawned = true;
    camera.shake = Math.max(camera.shake, 16);
    popups.push({
      x: boss.x + boss.w * 0.5,
      y: boss.y - 24,
      vy: -16,
      ttl: 1.45,
      text: "BIG BOSS!",
      color: "#ff9d84",
    });
  }

  function isFinalBossAlive() {
    for (const enemy of enemies) {
      if (enemy.type === "bigBoss" && enemy.state !== "defeated") {
        return true;
      }
    }
    return false;
  }

  function findSurfaceY(x, width, preferHigh) {
    let highest = level.groundY;
    let raised = level.groundY;

    for (const platform of level.platforms) {
      if (platform.kind === "ground" || platform.kind === "plant") continue;

      if (!rangeOverlap(x, x + width, platform.x, platform.x + platform.w)) continue;

      highest = Math.min(highest, platform.y);
      if (platform.y < level.groundY - 80) {
        raised = Math.min(raised, platform.y);
      }
    }

    if (preferHigh && raised < level.groundY) {
      return raised;
    }

    return highest;
  }

  async function startGame() {
    applyProfileFromSetup();
    rememberPlayerName();
    if (!playerServerId) {
      playerServerId = ensurePlayerServerId();
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    await registerPlayerNameOnServer();

    resetGame();
    gameState = "playing";
    document.body.classList.add("playing-mode");
    overlay.classList.remove("visible");
    unlockAudioFromGesture();
    playMusic();
    return true;
  }

  function bindStartButton(button) {
    if (!button) return;

    let triggered = false;
    const activate = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if (triggered) return;
      triggered = true;
      Promise.resolve(startGame())
        .then((started) => {
          if (!started) {
            triggered = false;
          }
        })
        .catch(() => {
          triggered = false;
        });
    };

    button.addEventListener("click", activate);
    button.addEventListener("pointerup", activate);
    button.addEventListener("touchend", activate, { passive: false });
  }

  function finishGame(win) {
    gameState = win ? "won" : "lost";
    document.body.classList.remove("playing-mode");
    void submitScoreOnServer(win);

    if (win) {
      playSfxWinJingle();
    } else {
      playSfxPlayerDeath();
    }

    const title = win ? "Fine Quadro" : "Game Over";
    const subtitle = win
      ? "Hai completato la fuga, sono le 18!!"
      : "Energia esaurita prima del traguardo del quadro.";

    panel.innerHTML = `
      <p class="kicker">Arcade ufficio IT</p>
      <h1>${title}</h1>
      <p>Giocatore: <strong>${playerProfile.name}</strong></p>
      <p>${subtitle}</p>
      <p>Difficolta: <strong>${difficultyLevel}/5</strong></p>
      <p>Punti totali: <strong>${score}</strong></p>
      <p class="controls">Premi il pulsante per ripartire.</p>
      <button id="start-btn" type="button">${win ? "Nuovo quadro" : "Riprova"}</button>
    `;

    const button = document.getElementById("start-btn");
    bindStartButton(button);

    overlay.classList.add("visible");
  }

  function update(dt) {
    worldTime += dt;
    finalBossNoticeCooldown = Math.max(0, finalBossNoticeCooldown - dt);

    updatePlayer(dt);
    spawnFinalBossIfNeeded(false);
    updateEnemies(dt);
    updateEnemySpawns(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updatePopups(dt);

    updateCamera();
    updateHud();

    if (player.x >= level.finishX && gameState === "playing") {
      if (!finalBossSpawned) {
        spawnFinalBossIfNeeded(true);
      }

      if (finalBossDefeated || !isFinalBossAlive()) {
        finalBossDefeated = true;
        finishGame(true);
      } else {
        player.x = Math.min(player.x, level.finishX - 70);
        if (finalBossNoticeCooldown <= 0) {
          popups.push({
            x: player.x + player.w * 0.5,
            y: player.y - 24,
            vy: -18,
            ttl: 1.1,
            text: "Abbatti il BIG BOSS!",
            color: "#ffd2c4",
          });
          finalBossNoticeCooldown = 1;
        }
      }
    }
  }

  function updatePlayer(dt) {
    player.invuln = Math.max(0, player.invuln - dt);
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);

    const moveX = getMoveInput();
    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = running ? player.runSpeed : player.walkSpeed;

    player.vx = moveX * speed;
    if (moveX !== 0) {
      player.facing = moveX > 0 ? 1 : -1;
    }

    if (jumpQueued && player.onGround) {
      player.vy = -player.jumpPower;
      player.onGround = false;
      spawnImpactParticles(player.x + player.w * 0.5, player.y + player.h, "#88d7ff", 8);
    }
    jumpQueued = false;

    player.vy += GRAVITY * dt;
    resolveEntityMovement(player, dt);

    player.x = clamp(player.x, 0, level.width - player.w);

    if (player.y > level.height + 120) {
      player.energy = 0;
      finishGame(false);
      return;
    }

    if (attackQueued && player.attackCooldown <= 0) {
      performAttack();
    }
    attackQueued = false;
  }

  function getMoveInput() {
    let x = 0;

    if (keys.has("ArrowLeft")) x -= 1;
    if (keys.has("ArrowRight")) x += 1;

    if (touchMove.active) {
      x += touchMove.x;
    }

    return clamp(x, -1, 1);
  }

  function cycleWeaponMode(withFx = true) {
    playerFireMode = playerFireMode === "mailShot" ? "meetingShot" : "mailShot";
    updateWeaponButton();

    if (!withFx || gameState !== "playing") return;
    spawnImpactParticles(
      player.x + player.w * 0.5,
      player.y + player.h * 0.45,
      playerFireMode === "mailShot" ? "#d8f2ff" : "#a5cbff",
      8
    );
  }

  function findAutoAimTarget(originX, originY, facing) {
    let best = null;
    let bestScore = Infinity;

    for (const enemy of enemies) {
      if (enemy.state === "defeated") continue;

      const ex = enemy.x + enemy.w * 0.5;
      const ey = enemy.y + enemy.h * 0.5;
      const dx = ex - originX;
      const dy = ey - originY;

      if (dx * facing < 0) continue;
      if (Math.abs(dy) > 360) continue;

      const dist = Math.hypot(dx, dy);
      if (dist > 720) continue;

      const score = enemy.type === "mail" ? dist * 0.8 : dist;
      if (score < bestScore) {
        best = enemy;
        bestScore = score;
      }
    }

    return best;
  }

  function performAttack() {
    const mode = PLAYER_FIRE_MODES[playerFireMode];

    player.attackCooldown = mode.cooldown;
    player.attackTimer = 0.12;

    const muzzleX = player.facing > 0 ? player.x + player.w + 6 : player.x - 6;
    const muzzleY = player.y + player.h * 0.48;
    const spreadY = (Math.random() * 2 - 1) * (playerFireMode === "mailShot" ? 12 : 6);
    let shotVx = player.facing * mode.speed;
    let shotVy = mode.rise + spreadY;

    const target = findAutoAimTarget(muzzleX, muzzleY, player.facing);
    if (target) {
      const tx = target.x + target.w * 0.5;
      const ty = target.y + target.h * 0.5;
      const dx = tx - muzzleX;
      const dy = ty - muzzleY;
      const len = Math.hypot(dx, dy) || 1;
      shotVx = (dx / len) * mode.speed;
      shotVy = (dy / len) * mode.speed + (playerFireMode === "meetingShot" ? -36 : 0);
    }

    spawnProjectile(
      muzzleX,
      muzzleY,
      shotVx,
      shotVy,
      playerFireMode,
      "player",
      mode.damage
    );

    spawnImpactParticles(
      muzzleX,
      muzzleY,
      playerFireMode === "mailShot" ? "#d9f4ff" : "#a8cfff",
      playerFireMode === "mailShot" ? 5 : 9
    );
  }

  function addScore(points, x, y) {
    const scaledPoints = Math.max(1, Math.round(points * getDifficultyConfig().scoreMul));
    score += scaledPoints;
    popups.push({
      x,
      y,
      vy: -34,
      ttl: 0.95,
      text: `+${scaledPoints}`,
      color: "#ffe286",
    });
  }

  function defeatEnemy(enemy, vxKick = 0, vyKick = -140) {
    if (!enemy || enemy.state === "defeated") return;

    enemy.hp = 0;
    enemy.state = "defeated";
    enemy.defeatTimer = 0.58;
    enemy.vx += vxKick;
    enemy.vy = Math.min(enemy.vy + vyKick, vyKick);

    const cx = enemy.x + enemy.w * 0.5;
    const cy = enemy.y + enemy.h * 0.45;
    addScore(enemy.points, cx, enemy.y - 16);
    spawnImpactParticles(cx, cy, "#ffe08a", 16);
    playSfxEnemyDefeat();

    if (enemy.type === "bigBoss") {
      finalBossDefeated = true;
      camera.shake = Math.max(camera.shake, 20);
      popups.push({
        x: cx,
        y: enemy.y - 34,
        vy: -22,
        ttl: 1.5,
        text: "BIG BOSS KO!",
        color: "#9dffc7",
      });
    }
  }

  function isStompTarget(enemy) {
    return enemy.type === "colleague" || enemy.type === "boss";
  }

  function tryStompEnemy(enemy) {
    if (!isStompTarget(enemy)) return false;
    if (enemy.state === "defeated") return false;
    if (player.vy < 150) return false;

    const prevFeet = player.prevY + player.h;
    const feet = player.y + player.h;
    const enemyTop = enemy.y + 8;
    const enemyBottom = enemy.y + enemy.h;

    if (prevFeet > enemyTop + 4) return false;
    if (feet < enemyTop || feet > enemyBottom) return false;

    const horizontalOverlap =
      player.x + player.w > enemy.x + 10 &&
      player.x < enemy.x + enemy.w - 10;
    if (!horizontalOverlap) return false;

    player.y = enemyTop - player.h;
    player.vy = -460;
    player.onGround = false;
    player.invuln = Math.max(player.invuln, 0.2);

    defeatEnemy(enemy, player.facing * 140, -220);
    spawnImpactParticles(player.x + player.w * 0.5, player.y + player.h, "#baf3ff", 12);
    return true;
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);

      if (enemy.state === "defeated") {
        enemy.defeatTimer -= dt;
        enemy.vx *= 0.9;

        if (!enemy.airborne && !enemy.hazard) {
          enemy.vy += GRAVITY * 0.85 * dt;
          resolveEntityMovement(enemy, dt);
        } else {
          enemy.x += enemy.vx * dt;
          enemy.y += enemy.vy * dt;
        }

        if (enemy.defeatTimer <= 0) {
          enemies.splice(i, 1);
        }
        continue;
      }

      if (enemy.state === "stunned") {
        enemy.stun -= dt;
        enemy.vx *= 0.88;

        if (!enemy.airborne && !enemy.hazard) {
          enemy.vy += GRAVITY * dt;
          resolveEntityMovement(enemy, dt);
        } else if (enemy.airborne) {
          enemy.x += enemy.vx * dt;
          enemy.y = enemy.baseY + Math.sin(worldTime * 5 + enemy.seed) * 22;
        }

        if (enemy.stun <= 0) {
          enemy.state = "alive";
        }
        continue;
      }

      updateEnemyBehavior(enemy, dt);

      if (!enemy.airborne && !enemy.hazard) {
        enemy.vy += GRAVITY * dt;
        resolveEntityMovement(enemy, dt);
      } else if (enemy.airborne) {
        enemy.x += enemy.vx * dt;
        enemy.baseY += Math.sin(worldTime * 0.5 + enemy.seed) * 0.08;
        enemy.y = enemy.baseY + Math.sin(worldTime * 6 + enemy.seed) * 26;
      }

      enemy.x = clamp(enemy.x, 0, level.width - enemy.w);

      if (enemy.state === "alive" && enemy.hitCooldown <= 0) {
        if (tryStompEnemy(enemy)) {
          enemy.hitCooldown = 0.85;
          continue;
        }

        if (enemyCanDamagePlayer(enemy)) {
          damagePlayer();
          enemy.hitCooldown = 0.85;
        }
      }
    }
  }

  function updateEnemyBehavior(enemy, dt) {
    const playerCenter = player.x + player.w * 0.5;
    const enemyCenter = enemy.x + enemy.w * 0.5;
    const dx = playerCenter - enemyCenter;
    const dirToPlayer = dx >= 0 ? 1 : -1;
    const absDx = Math.abs(dx);
    const cooldownMul = getDifficultyConfig().cooldownMul;

    if (enemy.type === "bigBoss") {
      enemy.specialCooldown -= dt;
      enemy.shotCooldown -= dt;

      if (absDx < 980) {
        enemy.dir = dirToPlayer;
      }

      if (absDx > 160) {
        const rageBoost = enemy.specialCooldown < 0.35 ? 2.3 : 1.3;
        enemy.vx = enemy.dir * enemy.speed * rageBoost;
      } else {
        enemy.vx *= 0.8;
      }

      if (enemy.specialCooldown <= 0 && enemy.onGround) {
        enemy.vy = -340;
        enemy.specialCooldown = (1.15 + Math.random() * 0.85) * cooldownMul;
      }

      if (enemy.shotCooldown <= 0 && absDx < 860) {
        const mouthX = enemy.x + enemy.w * (enemy.dir > 0 ? 0.86 : 0.14);
        const mouthY = enemy.y + enemy.h * 0.34;
        const dir = enemy.dir;

        spawnProjectile(mouthX, mouthY, dir * 270, -50, "packet");
        spawnProjectile(mouthX, mouthY + 22, dir * 235, -15, "packet");
        enemy.shotCooldown = (1.25 + Math.random() * 0.9) * cooldownMul;
      }
      return;
    }

    if (enemy.type === "boss") {
      if (absDx < 460) {
        enemy.dir = dirToPlayer;
        enemy.vx = enemy.dir * enemy.speed;
      } else {
        patrol(enemy, 0.7);
      }
      return;
    }

    if (enemy.type === "colleague") {
      enemy.specialCooldown -= dt;

      if (absDx < 380) {
        enemy.dir = dirToPlayer;
        if (enemy.specialCooldown <= 0) {
          enemy.vx = enemy.dir * (enemy.speed + 185);
          enemy.vy = -200;
          enemy.specialCooldown = (1.7 + Math.random() * 1.1) * cooldownMul;
        } else {
          enemy.vx = enemy.dir * (enemy.speed + 22);
        }
      } else {
        patrol(enemy, 0.9);
      }
      return;
    }

    if (enemy.type === "commercial") {
      enemy.specialCooldown -= dt;

      if (absDx < 460) {
        enemy.dir = dirToPlayer;

        if (enemy.specialCooldown <= 0) {
          enemy.vx = enemy.dir * (enemy.speed + 170);
          enemy.vy = -220;
          enemy.specialCooldown = (1.2 + Math.random() * 0.95) * cooldownMul;
        } else {
          enemy.vx = enemy.dir * (enemy.speed + 35);
        }
      } else {
        patrol(enemy, 1.02);
      }
      return;
    }

    if (enemy.type === "client") {
      enemy.specialCooldown -= dt;

      if (absDx < 430) {
        enemy.dir = dirToPlayer;
        enemy.vx = enemy.dir * enemy.speed * 0.78;
      } else {
        patrol(enemy, 0.75);
      }

      if (enemy.specialCooldown <= 0 && absDx < 520) {
        spawnProjectile(
          enemy.x + enemy.w * 0.5,
          enemy.y + enemy.h * 0.35,
          enemy.dir * (160 + Math.random() * 40),
          -35 + (Math.random() * 24 - 12),
          "invite"
        );
        enemy.specialCooldown = (2 + Math.random() * 1.2) * cooldownMul;
      }
      return;
    }

    if (enemy.type === "meeting") {
      enemy.specialCooldown -= dt;

      if (absDx < 420) {
        enemy.dir = dirToPlayer;
      }

      enemy.vx = enemy.dir * enemy.speed * 0.68;

      if (enemy.specialCooldown <= 0 && absDx < 520) {
        spawnProjectile(
          enemy.x + enemy.w * 0.5,
          enemy.y + enemy.h * 0.35,
          enemy.dir * 180,
          -45,
          "invite"
        );
        enemy.specialCooldown = (2.2 + Math.random() * 1.1) * cooldownMul;
      }
      return;
    }

    if (enemy.type === "mail") {
      enemy.dir = dirToPlayer;
      enemy.vx += (enemy.dir * enemy.speed - enemy.vx) * 0.12;
      return;
    }

    if (enemy.type === "hacker") {
      enemy.shotCooldown -= dt;

      if (absDx < 220) {
        enemy.dir = -dirToPlayer;
        enemy.vx = enemy.dir * enemy.speed;
      } else if (absDx > 350) {
        enemy.dir = dirToPlayer;
        enemy.vx = enemy.dir * enemy.speed * 0.82;
      } else {
        enemy.vx *= 0.88;
      }

      if (enemy.shotCooldown <= 0 && absDx < 560) {
        spawnProjectile(
          enemy.x + enemy.w * 0.5,
          enemy.y + enemy.h * 0.35,
          dirToPlayer * (250 + Math.random() * 40),
          -10 + (Math.random() * 40 - 20),
          "packet"
        );
        enemy.shotCooldown = (1 + Math.random() * 1.2) * cooldownMul;
      }
      return;
    }

    if (enemy.type === "budget") {
      enemy.specialCooldown -= dt;

      if (absDx < 560) {
        enemy.dir = dirToPlayer;
        enemy.vx = enemy.dir * enemy.speed * (enemy.specialCooldown < 0.4 ? 1.5 : 1);
      } else {
        patrol(enemy, 0.82);
      }

      if (enemy.specialCooldown <= 0) {
        enemy.specialCooldown = (1.2 + Math.random() * 1.6) * cooldownMul;
      }
      return;
    }

    if (enemy.type === "warroom") {
      enemy.vx = 0;
      enemy.vy = 0;
    }
  }

  function patrol(enemy, factor) {
    if (enemy.x < enemy.patrolMin) enemy.dir = 1;
    if (enemy.x > enemy.patrolMax) enemy.dir = -1;
    enemy.vx = enemy.dir * enemy.speed * factor;
  }

  function enemyCanDamagePlayer(enemy) {
    if (enemy.type === "warroom") {
      const warRoomAura = {
        x: enemy.x - 24,
        y: enemy.y - 14,
        w: enemy.w + 48,
        h: enemy.h + 30,
      };
      return aabbOverlap(player, warRoomAura);
    }

    return aabbOverlap(player, enemy);
  }

  function spawnProjectile(x, y, vx, vy, type, owner = "enemy", damage = 1) {
    const style = PROJECTILE_STYLES[type];
    if (!style) return;

    projectiles.push({
      type,
      x: x - style.w * 0.5,
      y: y - style.h * 0.5,
      w: style.w,
      h: style.h,
      vx,
      vy,
      ttl: style.ttl,
      color: style.color,
      gravity: style.gravity,
      owner,
      damage,
    });
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const p = projectiles[i];

      p.ttl -= dt;
      if (p.ttl <= 0) {
        projectiles.splice(i, 1);
        continue;
      }

      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (projectileHitsPlatform(p)) {
        projectiles.splice(i, 1);
        continue;
      }

      if (p.owner === "enemy") {
        if (aabbOverlap(player, p)) {
          projectiles.splice(i, 1);
          damagePlayer();
          continue;
        }
      } else {
        let blockedByProjectile = -1;
        for (let j = projectiles.length - 1; j >= 0; j -= 1) {
          if (j === i) continue;
          const other = projectiles[j];
          if (other.owner !== "enemy") continue;
          if (!aabbOverlap(p, other)) continue;
          blockedByProjectile = j;
          break;
        }

        if (blockedByProjectile !== -1) {
          const first = Math.max(i, blockedByProjectile);
          const second = Math.min(i, blockedByProjectile);
          const cx = p.x + p.w * 0.5;
          const cy = p.y + p.h * 0.5;

          projectiles.splice(first, 1);
          projectiles.splice(second, 1);
          addScore(15, cx, cy);
          spawnImpactParticles(cx, cy, "#b6eeff", 8);

          if (second < i) {
            i -= 1;
          }
          continue;
        }

        let hitEnemy = null;
        for (const enemy of enemies) {
          if (enemy.state === "defeated") continue;
          if (!aabbOverlap(enemy, p)) continue;
          hitEnemy = enemy;
          break;
        }

        if (hitEnemy) {
          projectiles.splice(i, 1);
          hitEnemy.hp -= p.damage;
          hitEnemy.vx += p.vx * 0.18;
          hitEnemy.vy = Math.min(hitEnemy.vy - 60, -90);

          const hx = hitEnemy.x + hitEnemy.w * 0.5;
          const hy = hitEnemy.y + hitEnemy.h * 0.45;

          if (hitEnemy.hp <= 0) {
            defeatEnemy(hitEnemy, p.vx * 0.2, -180);
          } else {
            hitEnemy.state = "stunned";
            hitEnemy.stun = 0.42 + Math.random() * 0.24;
            spawnImpactParticles(hx, hy, "#9cd9ff", 10);
          }
          continue;
        }
      }

      if (
        p.x < -200 ||
        p.x > level.width + 200 ||
        p.y < -220 ||
        p.y > level.height + 220
      ) {
        projectiles.splice(i, 1);
      }
    }
  }

  function projectileHitsPlatform(p) {
    for (const platform of level.platforms) {
      if (!platform.solid) continue;
      if (aabbOverlap(p, platform)) return true;
    }
    return false;
  }

  function damagePlayer() {
    if (player.invuln > 0 || gameState !== "playing") return;

    player.energy -= 1;
    player.invuln = 1;

    camera.shake = 13;
    spawnImpactParticles(player.x + player.w * 0.5, player.y + player.h * 0.5, "#ff9f8e", 18);

    if (player.energy <= 0) {
      player.energy = 0;
      finishGame(false);
    } else {
      playSfxPlayerHit();
    }
  }

  function canOccupyAt(entity, x, y, ignorePlatform = null) {
    const probe = { x, y, w: entity.w, h: entity.h };
    for (const platform of level.platforms) {
      if (!platform.solid || platform === ignorePlatform) continue;
      if (aabbOverlap(probe, platform)) return false;
    }
    return true;
  }

  function tryLedgeAssist(entity, platform, side) {
    if (entity !== player) return false;
    if (!platform.solid || platform.kind === "ground") return false;
    if (entity.vy > 120) return false;

    const previousFeet = entity.prevY + entity.h;
    if (previousFeet < platform.y - 88 || previousFeet > platform.y + 18) return false;

    const edgeInset = Math.min(8, Math.max(0, platform.w - entity.w));
    let landingX =
      side > 0
        ? platform.x + edgeInset
        : platform.x + platform.w - entity.w - edgeInset;
    landingX = clamp(landingX, platform.x, platform.x + platform.w - entity.w);
    const landingY = platform.y - entity.h;

    if (!canOccupyAt(entity, landingX, landingY, platform)) return false;

    entity.x = landingX;
    entity.y = landingY;
    entity.prevY = landingY;
    entity.vx = 0;
    entity.vy = 0;
    entity.onGround = true;
    return true;
  }

  function resolveEntityMovement(entity, dt) {
    entity.prevX = entity.x;
    entity.prevY = entity.y;

    entity.x += entity.vx * dt;

    for (const platform of level.platforms) {
      if (!platform.solid) continue;
      if (!aabbOverlap(entity, platform)) continue;

      if (entity.prevX + entity.w <= platform.x) {
        if (tryLedgeAssist(entity, platform, 1)) continue;
        entity.x = platform.x - entity.w;
      } else if (entity.prevX >= platform.x + platform.w) {
        if (tryLedgeAssist(entity, platform, -1)) continue;
        entity.x = platform.x + platform.w;
      } else {
        entity.x = entity.prevX;
      }

      entity.vx = 0;
    }

    entity.y += entity.vy * dt;
    entity.onGround = false;

    for (const platform of level.platforms) {
      if (!platform.solid) continue;
      if (!aabbOverlap(entity, platform)) continue;

      if (entity.prevY + entity.h <= platform.y + 4 && entity.vy >= 0) {
        entity.y = platform.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else if (entity.prevY >= platform.y + platform.h - 4 && entity.vy < 0) {
        entity.y = platform.y + platform.h;
        entity.vy = 0;
      } else if (entity.x + entity.w * 0.5 < platform.x + platform.w * 0.5) {
        entity.x = platform.x - entity.w;
        entity.vx = Math.min(0, entity.vx);
      } else {
        entity.x = platform.x + platform.w;
        entity.vx = Math.max(0, entity.vx);
      }
    }
  }

  function spawnImpactParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 200;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ttl: 0.28 + Math.random() * 0.42,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.ttl -= dt;

      if (p.ttl <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.88;
      p.vy *= 0.88;
    }
  }

  function updatePopups(dt) {
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const popup = popups[i];
      popup.ttl -= dt;
      popup.y += popup.vy * dt;

      if (popup.ttl <= 0) {
        popups.splice(i, 1);
      }
    }
  }

  function updateCamera() {
    const targetX = clamp(player.x - canvas.width * 0.35, 0, Math.max(0, level.width - canvas.width));
    const targetY = getFixedCameraY();

    camera.x += (targetX - camera.x) * 0.12;
    camera.y = targetY;

    if (camera.shake > 0.2) {
      camera.shake *= 0.84;
      camera.shakeX = (Math.random() * 2 - 1) * camera.shake;
      camera.shakeY = 0;
    } else {
      camera.shake = 0;
      camera.shakeX = 0;
      camera.shakeY = 0;
    }
  }

  function getFixedCameraY() {
    const maxY = Math.max(0, level.height - canvas.height);
    return clamp(level.groundY - canvas.height * 0.84, 0, maxY);
  }

  function updateHud() {
    energyEl.textContent = `${player.energy}/${MAX_ENERGY}`;
    energyEl.style.color = player.energy <= 3 ? "#ff8f74" : "#edf7ff";

    const progress = getProgress();
    const currentMinutes = START_HOUR * 60 + Math.floor(progress * SHIFT_MINUTES);
    const hours = Math.floor(currentMinutes / 60) % 24;
    const minutes = currentMinutes % 60;

    timeEl.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    scoreEl.textContent = `${score}`;
    if (difficultyHudEl) {
      difficultyHudEl.textContent = `${difficultyLevel}/5`;
    }
    if (playerNameHudEl) {
      playerNameHudEl.textContent = playerProfile.name;
    }
    drawPlayerPortrait();
    updateWeaponButton();
  }

  function getProgress() {
    return clamp((player.x - level.startX) / (level.finishX - level.startX), 0, 1);
  }

  function render() {
    drawBackground();

    ctx.save();
    ctx.translate(-camera.x + camera.shakeX, -camera.y + camera.shakeY);
    drawWorld();
    ctx.restore();

    drawProgressPanel();
    drawScreenFx();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#0a1f35");
    sky.addColorStop(0.45, "#13385a");
    sky.addColorStop(1, "#101f2d");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const parallaxA = camera.x * 0.15;
    const parallaxB = camera.x * 0.3;

    ctx.fillStyle = "rgba(34, 78, 109, 0.45)";
    for (let x = -260 - (parallaxA % 260); x < canvas.width + 260; x += 260) {
      const h = 120 + ((x * 13) % 90);
      ctx.fillRect(x, canvas.height - 360 - h, 170, h + 360);
    }

    ctx.fillStyle = "rgba(53, 105, 135, 0.32)";
    for (let x = -180 - (parallaxB % 180); x < canvas.width + 180; x += 180) {
      const h = 90 + ((x * 7) % 80);
      ctx.fillRect(x, canvas.height - 280 - h, 120, h + 280);
    }
  }

  function drawWorld() {
    drawOfficeShell();
    drawPlatforms();
    drawSigns();
    drawFinishGate();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawPopups();
  }

  function drawOfficeShell() {
    const wallGradient = ctx.createLinearGradient(0, 90, 0, level.groundY);
    wallGradient.addColorStop(0, "#0f2a43");
    wallGradient.addColorStop(0.5, "#113552");
    wallGradient.addColorStop(1, "#1c4259");

    ctx.fillStyle = wallGradient;
    ctx.fillRect(0, 90, level.width, level.groundY - 90);

    ctx.strokeStyle = "rgba(118, 195, 233, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 106; y < level.groundY - 20; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(level.width, y);
      ctx.stroke();
    }

    for (const column of level.columns) {
      if (!isVisible(column.x, column.y, column.w, column.h, 120)) continue;

      ctx.fillStyle = "#204b67";
      ctx.fillRect(column.x, column.y, column.w, column.h);

      ctx.fillStyle = "#2e647f";
      ctx.fillRect(column.x + 8, column.y, 12, column.h);

      ctx.fillStyle = "rgba(6, 17, 26, 0.26)";
      ctx.fillRect(column.x + column.w - 12, column.y, 12, column.h);
    }

    for (const windowFrame of level.windows) {
      if (!isVisible(windowFrame.x, windowFrame.y, windowFrame.w, windowFrame.h, 180)) continue;

      const x = windowFrame.x;
      const y = windowFrame.y;
      const w = windowFrame.w;
      const h = windowFrame.h;

      // Back panel where the in-store POS is mounted.
      ctx.fillStyle = "rgba(31, 79, 105, 0.46)";
      ctx.fillRect(x - 10, y - 10, w + 20, h + 20);

      const centerX = x + w * 0.5;
      const termW = Math.min(136, w * 0.62);
      const termH = Math.min(92, h * 0.72);
      const termX = centerX - termW * 0.5;
      const termY = y + h * 0.2;
      const standTopY = termY + termH + 2;
      const baseY = standTopY + 22;

      // Soft shadow on wall.
      ctx.fillStyle = "rgba(7, 18, 28, 0.35)";
      ctx.beginPath();
      ctx.ellipse(centerX + 5, termY + termH * 0.65, termW * 0.56, termH * 0.5, -0.12, 0, Math.PI * 2);
      ctx.fill();

      // Receipt strip on top.
      ctx.fillStyle = "#f2f8fc";
      ctx.fillRect(termX + termW * 0.6, termY - 13, termW * 0.24, 13);
      ctx.fillStyle = "#d8e6ef";
      ctx.fillRect(termX + termW * 0.62, termY - 8, termW * 0.2, 2);

      // Terminal body in perspective.
      const shellGrad = ctx.createLinearGradient(termX, termY, termX, termY + termH);
      shellGrad.addColorStop(0, "#97b2c4");
      shellGrad.addColorStop(0.55, "#6f8da1");
      shellGrad.addColorStop(1, "#49657a");
      ctx.fillStyle = shellGrad;
      ctx.beginPath();
      ctx.moveTo(termX + 10, termY + 8);
      ctx.lineTo(termX + termW - 2, termY + 2);
      ctx.lineTo(termX + termW - 14, termY + termH - 8);
      ctx.lineTo(termX + 2, termY + termH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#253f51";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Screen.
      const screenX = termX + termW * 0.08;
      const screenY = termY + termH * 0.12;
      const screenW = termW * 0.52;
      const screenH = termH * 0.24;
      ctx.fillStyle = "#152737";
      ctx.fillRect(screenX, screenY, screenW, screenH);
      ctx.fillStyle = "#81cad7";
      ctx.fillRect(screenX + 3, screenY + 3, screenW - 6, screenH - 6);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(screenX + 6, screenY + 5, screenW * 0.46, 4);

      // Card slot + inserted card.
      const slotX = termX + termW * 0.63;
      const slotY = termY + termH * 0.28;
      const slotW = termW * 0.24;
      ctx.fillStyle = "#1a2c3b";
      ctx.fillRect(slotX, slotY, slotW, 6);
      ctx.fillStyle = "#d9eef9";
      ctx.fillRect(slotX + slotW * 0.46, slotY - 8, slotW * 0.46, 8);
      ctx.fillStyle = "#67bde3";
      ctx.fillRect(slotX + slotW * 0.52, slotY - 6, slotW * 0.28, 3);

      // Keypad.
      const padX = termX + termW * 0.1;
      const padY = termY + termH * 0.46;
      const keyW = Math.max(7, Math.floor(termW * 0.095));
      const keyH = Math.max(7, Math.floor(termH * 0.105));
      const gap = 4;
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const kx = padX + col * (keyW + gap);
          const ky = padY + row * (keyH + gap);
          ctx.fillStyle = "#1f3548";
          ctx.fillRect(kx, ky, keyW, keyH);
          ctx.fillStyle = "rgba(183, 226, 244, 0.72)";
          ctx.fillRect(kx + 2, ky + 2, keyW - 4, 2);
        }
      }

      // Contactless icon.
      const nfcX = termX + termW * 0.78;
      const nfcY = termY + termH * 0.61;
      ctx.strokeStyle = "#d4f8ff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(nfcX, nfcY, 5 + i * 4, -Math.PI * 0.36, Math.PI * 0.36);
        ctx.stroke();
      }

      // Stand and desk base.
      ctx.fillStyle = "#3f5e72";
      ctx.fillRect(centerX - 7, standTopY, 14, 22);
      ctx.fillStyle = "#2e4b5f";
      ctx.fillRect(centerX - 36, baseY, 72, 8);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(centerX - 40, baseY + 7, 80, 4);

      ctx.fillStyle = "#e9f8ff";
      ctx.font = "700 9px Trebuchet MS, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("STORE POS", termX + 8, termY + termH - 9);
    }

    for (const lamp of level.lamps) {
      if (!isVisible(lamp.x - 24, lamp.y - 8, 48, 54, 80)) continue;

      ctx.strokeStyle = "#8ec9e6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lamp.x, 96);
      ctx.lineTo(lamp.x, lamp.y + 12);
      ctx.stroke();

      ctx.fillStyle = "#9fd3eb";
      ctx.beginPath();
      ctx.moveTo(lamp.x - 20, lamp.y + 12);
      ctx.lineTo(lamp.x + 20, lamp.y + 12);
      ctx.lineTo(lamp.x + 13, lamp.y + 26);
      ctx.lineTo(lamp.x - 13, lamp.y + 26);
      ctx.closePath();
      ctx.fill();

      const cone = ctx.createLinearGradient(lamp.x, lamp.y + 24, lamp.x, lamp.y + 120);
      cone.addColorStop(0, "rgba(167, 236, 255, 0.14)");
      cone.addColorStop(1, "rgba(167, 236, 255, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(lamp.x - 12, lamp.y + 26);
      ctx.lineTo(lamp.x + 12, lamp.y + 26);
      ctx.lineTo(lamp.x + 64, lamp.y + 130);
      ctx.lineTo(lamp.x - 64, lamp.y + 130);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#214960";
    ctx.fillRect(0, level.groundY - 18, level.width, 18);
  }

  function drawPlatforms() {
    for (const platform of level.platforms) {
      if (!isVisible(platform.x, platform.y, platform.w, platform.h, 120)) continue;

      if (platform.kind === "ground") {
        const floorGradient = ctx.createLinearGradient(0, platform.y - 16, 0, platform.y + platform.h);
        floorGradient.addColorStop(0, "#3b6450");
        floorGradient.addColorStop(0.3, "#2d5140");
        floorGradient.addColorStop(1, "#1d372b");
        ctx.fillStyle = floorGradient;
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        const tileStart = Math.floor((camera.x - 80) / 52) * 52;
        const tileEnd = Math.ceil((camera.x + canvas.width + 80) / 52) * 52;
        ctx.fillStyle = "#4a7760";
        for (let x = tileStart; x < tileEnd; x += 52) {
          ctx.fillRect(x, platform.y + 8, 30, 9);
        }

        ctx.fillStyle = "#5f8f74";
        ctx.fillRect(platform.x, platform.y - 16, platform.w, 16);
        continue;
      }

      if (platform.kind === "desk") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(platform.x + 8, platform.y + platform.h - 10, platform.w, 12);

        ctx.fillStyle = "#1f445c";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        const topGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + 24);
        topGradient.addColorStop(0, "#a0cbdd");
        topGradient.addColorStop(1, "#6ea5be");
        ctx.fillStyle = topGradient;
        ctx.fillRect(platform.x + 3, platform.y + 3, platform.w - 6, 22);

        ctx.fillStyle = "#0d2940";
        ctx.fillRect(platform.x + 12, platform.y + 30, 26, 20);
        ctx.fillRect(platform.x + platform.w - 38, platform.y + 30, 26, 20);

        ctx.fillStyle = "#15384f";
        ctx.fillRect(platform.x + 10, platform.y + platform.h - 14, 10, 14);
        ctx.fillRect(platform.x + platform.w - 20, platform.y + platform.h - 14, 10, 14);
        continue;
      }

      if (platform.kind === "server") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.fillRect(platform.x + 6, platform.y + platform.h - 10, platform.w, 10);

        ctx.fillStyle = "#2a3042";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        ctx.fillStyle = "#5d7a92";
        ctx.fillRect(platform.x + 5, platform.y + 6, platform.w - 10, 16);

        ctx.fillStyle = "#89ff9f";
        for (let y = platform.y + 28; y < platform.y + platform.h - 8; y += 12) {
          ctx.fillRect(platform.x + 12, y, 8, 4);
          ctx.fillRect(platform.x + 26, y, 8, 4);
        }

        ctx.fillStyle = "#6fd6ff";
        for (let y = platform.y + 28; y < platform.y + platform.h - 8; y += 12) {
          ctx.fillRect(platform.x + platform.w - 26, y, 10, 3);
        }
        continue;
      }

      if (platform.kind === "printer") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.23)";
        ctx.fillRect(platform.x + 5, platform.y + platform.h - 8, platform.w, 9);

        ctx.fillStyle = "#d8e4ee";
        ctx.fillRect(platform.x, platform.y + 8, platform.w, platform.h - 8);

        ctx.fillStyle = "#aebfce";
        ctx.fillRect(platform.x + 4, platform.y + 14, platform.w - 8, 12);

        ctx.fillStyle = "#6f8292";
        ctx.fillRect(platform.x + 8, platform.y + platform.h - 16, platform.w - 16, 10);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(platform.x + 12, platform.y, platform.w - 24, 14);
        continue;
      }

      if (platform.kind === "meetingTable") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.fillRect(platform.x + 8, platform.y + platform.h - 8, platform.w, 10);

        ctx.fillStyle = "#6b8ea2";
        ctx.fillRect(platform.x, platform.y + 10, platform.w, platform.h - 10);

        ctx.fillStyle = "#86b4c8";
        ctx.fillRect(platform.x + 4, platform.y + 3, platform.w - 8, 16);

        ctx.fillStyle = "#466174";
        ctx.fillRect(platform.x + 20, platform.y + platform.h - 16, 12, 16);
        ctx.fillRect(platform.x + platform.w - 32, platform.y + platform.h - 16, 12, 16);

        const chairW = 20;
        ctx.fillStyle = "#31495a";
        ctx.fillRect(platform.x - chairW + 2, platform.y + 18, chairW, 18);
        ctx.fillRect(platform.x + platform.w - 2, platform.y + 18, chairW, 18);
        continue;
      }

      if (platform.kind === "lounge") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.fillRect(platform.x + 6, platform.y + platform.h - 8, platform.w, 10);

        ctx.fillStyle = "#375a72";
        ctx.fillRect(platform.x, platform.y + 18, platform.w, platform.h - 18);

        ctx.fillStyle = "#5c8eac";
        ctx.fillRect(platform.x + 4, platform.y + 6, platform.w - 8, 20);

        ctx.fillStyle = "#6ea2bf";
        ctx.fillRect(platform.x + 10, platform.y + 24, platform.w - 20, 12);

        ctx.fillStyle = "#29495d";
        ctx.fillRect(platform.x + 6, platform.y + platform.h - 10, 14, 10);
        ctx.fillRect(platform.x + platform.w - 20, platform.y + platform.h - 10, 14, 10);
        continue;
      }

      if (platform.kind === "locker") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(platform.x + 4, platform.y + platform.h - 8, platform.w, 10);

        ctx.fillStyle = "#4c667b";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        ctx.fillStyle = "#7394ac";
        ctx.fillRect(platform.x + 4, platform.y + 6, platform.w - 8, 18);

        ctx.strokeStyle = "#1d3040";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x + 6, platform.y + 28, platform.w - 12, platform.h - 34);

        ctx.fillStyle = "#f2d28e";
        ctx.fillRect(platform.x + platform.w - 16, platform.y + platform.h * 0.48, 6, 10);
        continue;
      }

      if (platform.kind === "shelf") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.fillRect(platform.x + 5, platform.y + platform.h - 8, platform.w, 9);

        ctx.fillStyle = "#6e7f89";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

        ctx.fillStyle = "#8ca0ad";
        ctx.fillRect(platform.x + 3, platform.y + 6, platform.w - 6, 10);
        ctx.fillRect(platform.x + 3, platform.y + 22, platform.w - 6, 8);
        ctx.fillRect(platform.x + 3, platform.y + 38, platform.w - 6, 8);

        ctx.fillStyle = "#3f515e";
        ctx.fillRect(platform.x + 8, platform.y + platform.h - 12, 8, 12);
        ctx.fillRect(platform.x + platform.w - 16, platform.y + platform.h - 12, 8, 12);
        continue;
      }

      if (platform.kind === "shelfStep") {
        ctx.fillStyle = "#7e95a3";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.fillStyle = "#b1c4ce";
        ctx.fillRect(platform.x + 2, platform.y + 2, platform.w - 4, 4);
        continue;
      }

      if (platform.kind === "plant") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.fillRect(platform.x + 4, platform.y + platform.h - 6, platform.w * 0.8, 8);

        ctx.fillStyle = "#7b5a3d";
        ctx.fillRect(platform.x + 8, platform.y + platform.h - 20, platform.w - 16, 20);

        ctx.fillStyle = "#2f936e";
        ctx.beginPath();
        ctx.arc(platform.x + platform.w * 0.5, platform.y + platform.h - 26, platform.w * 0.38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#43aa80";
        ctx.beginPath();
        ctx.arc(platform.x + platform.w * 0.35, platform.y + platform.h - 34, platform.w * 0.2, 0, Math.PI * 2);
        ctx.arc(platform.x + platform.w * 0.62, platform.y + platform.h - 36, platform.w * 0.18, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (platform.kind === "catwalk") {
        ctx.fillStyle = "#556f82";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.fillStyle = "#89adc5";
        ctx.fillRect(platform.x + 4, platform.y + 4, platform.w - 8, 4);

        ctx.fillStyle = "#395367";
        for (let x = platform.x + 6; x < platform.x + platform.w - 6; x += 14) {
          ctx.fillRect(x, platform.y + 10, 8, 2);
        }
      }
    }
  }

  function drawSigns() {
    for (const sign of level.signs) {
      if (!isVisible(sign.x - 130, sign.y - 36, 260, 72, 120)) continue;

      ctx.fillStyle = "rgba(8, 27, 42, 0.45)";
      ctx.fillRect(sign.x - 118, sign.y - 28, 236, 58);

      const panelGradient = ctx.createLinearGradient(sign.x - 110, sign.y - 24, sign.x - 110, sign.y + 24);
      panelGradient.addColorStop(0, "#2a7295");
      panelGradient.addColorStop(1, "#1f5773");
      ctx.fillStyle = panelGradient;
      ctx.fillRect(sign.x - 110, sign.y - 24, 220, 48);

      ctx.strokeStyle = "#89dbff";
      ctx.lineWidth = 3;
      ctx.strokeRect(sign.x - 110, sign.y - 24, 220, 48);

      ctx.fillStyle = "#7de6ff";
      ctx.font = "900 30px Impact, Haettenschweiler, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sign.text, sign.x, sign.y + 1);
    }
  }

  function drawFinishGate() {
    const x = level.finishX;

    if (!isVisible(x - 80, level.groundY - 260, 200, 300, 220)) return;

    ctx.fillStyle = "#3f6f88";
    ctx.fillRect(x - 12, level.groundY - 250, 24, 250);

    ctx.fillStyle = "#264c62";
    ctx.fillRect(x + 98, level.groundY - 250, 24, 250);

    ctx.fillStyle = "#6ce1ff";
    ctx.fillRect(x - 20, level.groundY - 282, 154, 32);

    ctx.fillStyle = "#0f2d40";
    ctx.font = "800 20px Impact, Haettenschweiler, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FINE TURNO 17:00", x + 57, level.groundY - 266);
  }

  function drawPlayer() {
    const blink = player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0;
    if (blink) return;

    drawHumanAvatar(player, getPlayerLook(), "", player.facing, false);

    if (player.attackTimer > 0) {
      const t = player.attackTimer / 0.12;
      const flashX = player.facing > 0 ? player.x + player.w + 10 : player.x - 10;
      const flashY = player.y + player.h * 0.48;
      const radius = 10 + (1 - t) * 8;

      ctx.fillStyle = `rgba(193, 239, 255, ${0.2 + (1 - t) * 0.55})`;
      ctx.beginPath();
      ctx.arc(flashX, flashY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEnemies() {
    const ordered = [...enemies].sort((a, b) => a.y - b.y);

    for (const enemy of ordered) {
      if (!isVisible(enemy.x, enemy.y, enemy.w, enemy.h, 120)) continue;

      if (enemy.type === "bigBoss") {
        drawBigBossAvatar(enemy);
      }

      if (enemy.type === "boss") {
        drawBossAvatar(enemy);
      }

      if (enemy.type === "colleague") {
        drawHumanAvatar(enemy, {
          skin: "#ffe0c2",
          hair: "#5a4a20",
          torso: "#f0b848",
          pants: "#41564c",
          accent: "#ffffff",
        }, enemy.label, enemy.dir, enemy.state === "stunned", enemy.hp, enemy.maxHp, true);
      }

      if (enemy.type === "commercial") {
        drawHumanAvatar(enemy, {
          skin: "#ffd8bf",
          hair: "#3f2a1c",
          torso: "#47b68d",
          pants: "#214d43",
          accent: "#e9ffd8",
        }, enemy.label, enemy.dir, enemy.state === "stunned", enemy.hp, enemy.maxHp, false, false);
      }

      if (enemy.type === "client") {
        drawHumanAvatar(enemy, {
          skin: "#f2d4c1",
          hair: "#2e2f36",
          torso: "#5f8ed6",
          pants: "#23375f",
          accent: "#fff0ad",
        }, enemy.label, enemy.dir, enemy.state === "stunned", enemy.hp, enemy.maxHp, false, false);
      }

      if (enemy.type === "hacker") {
        drawHumanAvatar(enemy, {
          skin: "#ddc9b8",
          hair: "#111016",
          torso: "#6d63a5",
          pants: "#241f35",
          accent: "#87f5f4",
        }, enemy.label, enemy.dir, enemy.state === "stunned", enemy.hp, enemy.maxHp, false, true);
      }

      if (enemy.type === "meeting") {
        drawMeetingAvatar(enemy);
      }

      if (enemy.type === "mail") {
        drawMailAvatar(enemy);
      }

      if (enemy.type === "warroom") {
        drawWarroomAvatar(enemy);
      }
      

      if (enemy.type === "budget") {
        drawBudgetAvatar(enemy);
      }
    }
  }

  function drawHumanAvatar(
    entity,
    palette,
    label,
    facing = 1,
    stunned = false,
    hp = 0,
    maxHp = 0,
    trip = false,
    masked = false,
    motionBoost = 1
  ) {
    const x = entity.x;
    const y = entity.y;
    const w = entity.w;
    const h = entity.h;
    const feminine = Boolean(palette.feminine);

    if (label) {
      drawLabel(label, x + w * 0.5, y - 18, stunned ? "#c9f5cf" : "#ffffff");
    }

    if (label && maxHp > 1) {
      const hpW = clamp(w * 0.65, 44, 184);
      const hpH = h > 120 ? 9 : 6;
      drawHpBar(x + w * 0.5 - hpW * 0.5, y - 8, hpW, hpH, hp / maxHp);
    }

    const speedFactor = clamp(Math.abs(entity.vx || 0) / 185, 0, 1.5) * motionBoost;
    const phase = worldTime * (4.2 + speedFactor * 2.4) + (entity.seed || x * 0.05);
    const legA = Math.sin(phase) * 0.62;
    const legB = -Math.sin(phase) * 0.62;
    const armA = -Math.sin(phase + 0.35) * 0.62;
    const armB = Math.sin(phase + 0.35) * 0.62;

    const p = Math.max(2, Math.floor(Math.min(w / 12, h / 17)));
    const sw = p * 12;
    const sh = p * 17;
    const sx = x + (w - sw) * 0.5;
    const sy = y + h - sh - 2;

    ctx.save();
    if (facing < 0) {
      ctx.translate(x + w * 0.5, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + w * 0.5), 0);
    }

    if (stunned) {
      ctx.globalAlpha = 0.68;
    }

    const shadeHex = (hex, amount) => {
      const source = String(hex || "").replace("#", "");
      if (source.length !== 6) return hex;
      const num = Number.parseInt(source, 16);
      const r = clamp(((num >> 16) & 255) + amount, 0, 255);
      const g = clamp(((num >> 8) & 255) + amount, 0, 255);
      const b = clamp((num & 255) + amount, 0, 255);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const drawVoxelBlock = (bx, by, bw, bh, baseColor, depth = Math.max(1, Math.round(p * 0.42))) => {
      const px = Math.round(bx);
      const py = Math.round(by);
      const pw = Math.max(2, Math.round(bw));
      const ph = Math.max(2, Math.round(bh));
      const d = Math.max(1, Math.min(depth, Math.round(Math.min(pw, ph) * 0.26)));

      ctx.fillStyle = shadeHex(baseColor, 24);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + d, py - d);
      ctx.lineTo(px + pw + d, py - d);
      ctx.lineTo(px + pw, py);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = shadeHex(baseColor, -22);
      ctx.beginPath();
      ctx.moveTo(px + pw, py);
      ctx.lineTo(px + pw + d, py - d);
      ctx.lineTo(px + pw + d, py + ph - d);
      ctx.lineTo(px + pw, py + ph);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = baseColor;
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "rgba(13, 22, 34, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pw, ph);
    };

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h - 2, w * 0.43, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs and shoes
    drawVoxelBlock(sx + p * 2.1, sy + p * (10 + legA), p * 2.3, p * 5.1, palette.pants);
    drawVoxelBlock(sx + p * 6.3, sy + p * (10 + legB), p * 2.3, p * 5.1, palette.pants);
    drawVoxelBlock(sx + p * 1.8, sy + p * 15, p * 2.9, p * 1.2, "#4d6c98");
    drawVoxelBlock(sx + p * 6, sy + p * 15, p * 2.9, p * 1.2, "#4d6c98");

    // Torso and arms
    drawVoxelBlock(sx + p * 2.3, sy + p * 5.2, p * 6, p * 6.2, palette.torso);
    drawVoxelBlock(sx + p * 0.6, sy + p * (6.1 + armA), p * 1.8, p * 5, palette.torso);
    drawVoxelBlock(sx + p * 8.2, sy + p * (6.1 + armB), p * 1.8, p * 4.4, palette.torso);
    drawVoxelBlock(sx + p * 8.2, sy + p * (9.8 + armB), p * 1.8, p * 1.3, palette.skin);

    // Shirt/tie accent
    ctx.fillStyle = shadeHex(palette.accent, 14);
    ctx.fillRect(Math.round(sx + p * 5.05), Math.round(sy + p * 6.1), Math.round(p * 1.05), Math.round(p * 3.8));

    // Head cube
    drawVoxelBlock(sx + p * 3, sy + p * 0.8, p * 4.9, p * 4.9, palette.skin, Math.max(1, Math.round(p * 0.5)));
    drawVoxelBlock(sx + p * 2.9, sy + p * 0.1, p * 5, p * 2.2, palette.hair, Math.max(1, Math.round(p * 0.4)));
    if (feminine || palette.hairLong) {
      drawVoxelBlock(sx + p * 2.7, sy + p * 2, p * 1.2, p * 3.5, palette.hair, Math.max(1, Math.round(p * 0.35)));
      if (feminine) {
        ctx.fillStyle = shadeHex(palette.accent, 18);
        ctx.fillRect(Math.round(sx + p * 4.8), Math.round(sy + p * 0.8), Math.round(p * 0.9), Math.round(p * 0.6));
      }
    }

    // Face details (side profile)
    ctx.fillStyle = "#f6fbff";
    ctx.fillRect(Math.round(sx + p * 6.45), Math.round(sy + p * 2.35), Math.round(p * 1), Math.round(p * 0.8));
    ctx.fillStyle = "#0f1622";
    ctx.fillRect(Math.round(sx + p * 6.9), Math.round(sy + p * 2.55), Math.round(p * 0.35), Math.round(p * 0.35));
    ctx.fillStyle = shadeHex(palette.skin, -12);
    ctx.fillRect(Math.round(sx + p * 7.2), Math.round(sy + p * 3.25), Math.round(p * 0.85), Math.round(p * 0.8));
    ctx.fillStyle = feminine ? "#a1557c" : "#5b3c33";
    ctx.fillRect(Math.round(sx + p * 6.2), Math.round(sy + p * 4.5), Math.round(p * 1.45), Math.round(p * 0.52));
    if (masked) {
      ctx.fillStyle = "#1c2230";
      ctx.fillRect(Math.round(sx + p * 6.1), Math.round(sy + p * 3.1), Math.round(p * 1.7), Math.round(p * 1.55));
    }

    if (trip) {
      drawVoxelBlock(sx + p * 9.1, sy + p * 12.3, p * 1.6, p * 1.1, "#f4dda8", Math.max(1, Math.round(p * 0.3)));
    }

    ctx.restore();
  }

  function drawBossAvatar(enemy) {
    const palette = {
      skin: "#ffd3be",
      hair: "#3b2020",
      torso: "#ce4f4f",
      pants: "#33222d",
      accent: "#ffd34f",
      feminine: false,
      hairLong: false,
    };

    drawHumanAvatar(
      enemy,
      palette,
      enemy.label,
      enemy.dir,
      enemy.state === "stunned",
      enemy.hp,
      enemy.maxHp,
      false,
      false,
      1.45
    );

    const phase = worldTime * 7 + enemy.seed;
    const tieSwing = Math.sin(phase) * 3;
    const tieX = enemy.x + enemy.w * (enemy.dir > 0 ? 0.58 : 0.42);
    const tieY = enemy.y + enemy.h * 0.53;
    const bagY = enemy.y + enemy.h * 0.66 + Math.sin(phase + 0.7) * 1.5;
    const bagX = enemy.x + enemy.w * (enemy.dir > 0 ? 0.27 : 0.73) - 7;

    ctx.save();
    if (enemy.dir < 0) {
      ctx.translate(enemy.x + enemy.w * 0.5, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(enemy.x + enemy.w * 0.5), 0);
    }

    if (enemy.state === "stunned") {
      ctx.globalAlpha = 0.72;
    }

    ctx.fillStyle = "#f6d162";
    ctx.beginPath();
    ctx.moveTo(tieX, tieY);
    ctx.lineTo(tieX + 5 + tieSwing * 0.25, tieY + 10);
    ctx.lineTo(tieX + 2, tieY + 10);
    ctx.lineTo(tieX - 3 + tieSwing * 0.2, tieY + 20);
    ctx.lineTo(tieX - 6 + tieSwing * 0.15, tieY + 10);
    ctx.lineTo(tieX - 2, tieY + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#23283a";
    ctx.fillRect(bagX, bagY, 12, 8);
    ctx.fillStyle = "#7f8db2";
    ctx.fillRect(bagX + 2, bagY + 2, 8, 2);
    ctx.fillStyle = "#cf9e45";
    ctx.fillRect(bagX + 4, bagY - 1, 4, 1);

    ctx.restore();
  }

  function drawBigBossAvatar(enemy) {
    const palette = {
      skin: "#e8bda3",
      hair: "#212a34",
      torso: "#4a668c",
      pants: "#2c3b53",
      accent: "#f6cd64",
      feminine: false,
      hairLong: false,
    };

    drawHumanAvatar(
      enemy,
      palette,
      enemy.label,
      enemy.dir,
      enemy.state === "stunned",
      enemy.hp,
      enemy.maxHp,
      false,
      false,
      1.85
    );

    // Extra boss details on top of the Minecraft base style.
    const phase = worldTime * 6 + enemy.seed;
    const tieSwing = Math.sin(phase) * 4.6;
    const pulse = 0.5 + Math.sin(phase * 1.4) * 0.5;
    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.w;
    const h = enemy.h;

    ctx.save();
    if (enemy.dir < 0) {
      ctx.translate(x + w * 0.5, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + w * 0.5), 0);
    }

    if (enemy.state === "stunned") {
      ctx.globalAlpha = 0.72;
    }

    // Tie
    const tieX = x + w * 0.53;
    const tieY = y + h * 0.43;
    ctx.fillStyle = "#ffd66f";
    ctx.beginPath();
    ctx.moveTo(tieX, tieY);
    ctx.lineTo(tieX + 6 + tieSwing * 0.22, tieY + 16);
    ctx.lineTo(tieX + 1, tieY + 30);
    ctx.lineTo(tieX - 5 + tieSwing * 0.18, tieY + 16);
    ctx.closePath();
    ctx.fill();

    // Shoulder badge
    ctx.fillStyle = "#f0d47a";
    ctx.fillRect(x + w * 0.66, y + h * 0.36, 10, 7);

    // Boss eyes glow
    ctx.fillStyle = `rgba(255, 120, 100, ${0.25 + pulse * 0.35})`;
    ctx.fillRect(x + w * 0.63, y + h * 0.25, 7, 3);
    ctx.fillStyle = "rgba(255, 205, 178, 0.8)";
    ctx.fillRect(x + w * 0.61, y + h * 0.24, 11, 1);

    ctx.restore();
  }

  function drawMeetingAvatar(enemy) {
    drawLabel(enemy.label, enemy.x + enemy.w * 0.5, enemy.y - 18, "#eaf4ff");
    drawHpBar(enemy.x + enemy.w * 0.5 - 22, enemy.y - 8, 44, 6, enemy.hp / enemy.maxHp);

    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.w;
    const h = enemy.h;
    const pulse = 1 + Math.sin(worldTime * 5 + enemy.seed) * 0.05;

    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#111d2a";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

    ctx.fillStyle = enemy.state === "stunned" ? "#7f8fa1" : "#2f7ed3";
    ctx.fillRect(x, y + 8, w, h - 10);

    ctx.fillStyle = "#8ec7ff";
    ctx.fillRect(x + 5, y + 4, w - 10, h * 0.5);
    ctx.fillStyle = "#0f2a43";
    ctx.fillRect(x + 5, y + 4, w - 10, 8);

    ctx.fillStyle = "#ff6c7f";
    ctx.fillRect(x + 9, y + 6, 5, 4);
    ctx.fillStyle = "#dfefff";
    ctx.fillRect(x + 18, y + 6, 22, 4);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 9px Trebuchet MS, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("LIVE 100+", x + 20, y + 14);

    const tileW = 10;
    const tileH = 8;
    let tileX = x + 10;
    let tileY = y + 18;
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i % 2 ? "#4a6fa3" : "#5f88bf";
      ctx.fillRect(tileX, tileY, tileW, tileH);
      ctx.fillStyle = "#ffd6be";
      ctx.fillRect(tileX + 3, tileY + 2, 3, 3);
      tileX += 12;
      if ((i + 1) % 3 === 0) {
        tileX = x + 10;
        tileY += 10;
      }
    }

    ctx.fillStyle = "#1a3147";
    ctx.fillRect(x + w * 0.5 - 15, y + h - 3, 30, 8);
    ctx.fillStyle = "#2b4c66";
    ctx.fillRect(x + w * 0.5 - 18, y + h + 4, 36, 6);

    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.32, 20 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawMailAvatar(enemy) {
    drawLabel(enemy.label, enemy.x + enemy.w * 0.5, enemy.y - 14, "#f8fdff");

    ctx.fillStyle = enemy.state === "stunned" ? "#b4c2c9" : "#d8f1ff";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    ctx.strokeStyle = "#28516a";
    ctx.lineWidth = 3;
    ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);

    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.52);
    ctx.lineTo(enemy.x + enemy.w, enemy.y);
    ctx.stroke();

    ctx.fillStyle = "#21516e";
    ctx.font = "800 13px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("@", enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.64);
  }

  function drawWarroomAvatar(enemy) {
    drawLabel(enemy.label, enemy.x + enemy.w * 0.5, enemy.y - 18, "#fff4df");
    drawHpBar(enemy.x + enemy.w * 0.5 - 22, enemy.y - 8, 44, 6, enemy.hp / enemy.maxHp);

    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.w;
    const h = enemy.h;
    const siren = 0.55 + Math.sin(worldTime * 8 + enemy.seed) * 0.45;

    ctx.fillStyle = "rgba(255, 120, 120, 0.1)";
    ctx.fillRect(x - 10, y - 8, w + 20, h + 16);

    ctx.fillStyle = "#fdf6f6";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#201a23";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

    ctx.fillStyle = enemy.state === "stunned" ? "#6f737d" : "#6b3a56";
    ctx.fillRect(x, y + 10, w, h - 12);

    ctx.fillStyle = "#2f2f44";
    ctx.fillRect(x + 6, y + 18, w - 12, h - 22);

    ctx.fillStyle = "#7cc6ff";
    ctx.fillRect(x + 10, y + 22, w - 20, 18);
    ctx.fillStyle = "#1d3f5e";
    ctx.fillRect(x + 10, y + 22, w - 20, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 8px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WAR ROOM", x + w * 0.5, y + 29);
    ctx.fillStyle = "#ffd280";
    ctx.fillText("PROD ALERT", x + w * 0.5, y + 36);

    ctx.fillStyle = "#4b2438";
    ctx.fillRect(x + 8, y + h - 9, 12, 7);
    ctx.fillRect(x + w - 20, y + h - 9, 12, 7);

    ctx.fillStyle = `rgba(255, 88, 88, ${0.4 + siren * 0.5})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd2d2";
    ctx.fillRect(x + w * 0.5 - 2, y + 4, 4, 4);

    ctx.strokeStyle = `rgba(255, 125, 125, ${0.25 + siren * 0.35})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, y - 6, w + 16, h + 12);
  }

  function drawBudgetAvatar(enemy) {
    drawLabel(enemy.label, enemy.x + enemy.w * 0.5, enemy.y - 16, "#e9ffd8");
    drawHpBar(enemy.x + enemy.w * 0.5 - 22, enemy.y - 8, 44, 6, enemy.hp / enemy.maxHp);

    const x = enemy.x;
    const y = enemy.y;
    const w = enemy.w;
    const h = enemy.h;
    const pulse = 1 + Math.sin(worldTime * 5 + enemy.seed) * 0.045;
    const cx = x + w * 0.5;
    const cy = y + h * 0.56;
    const coinR = Math.min(w, h) * 0.38 * pulse;
    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.beginPath();
    ctx.ellipse(cx, y + h - 3, w * 0.34, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const ringGrad = ctx.createRadialGradient(cx - 5, cy - 8, 4, cx, cy, coinR + 6);
    ringGrad.addColorStop(0, enemy.state === "stunned" ? "#d1d5b2" : "#fff3a8");
    ringGrad.addColorStop(0.6, enemy.state === "stunned" ? "#b5bc8d" : "#e5cf62");
    ringGrad.addColorStop(1, enemy.state === "stunned" ? "#798063" : "#836e2a");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coinR + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.state === "stunned" ? "#adb27e" : "#d5ba4f";
    ctx.beginPath();
    ctx.arc(cx, cy, coinR - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = enemy.state === "stunned" ? "#7f845d" : "#4d3f16";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clear Euro symbol in the center.
    const euroColor = enemy.state === "stunned" ? "#f0f3d4" : "#fff8cf";
    const euroSize = Math.max(24, Math.floor(coinR * 1.22));
    ctx.font = `900 ${euroSize}px Trebuchet MS, Arial Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = enemy.state === "stunned" ? "#6f6f46" : "#5f4b1d";
    ctx.strokeText("€", cx + 1, cy + 1);
    ctx.fillStyle = euroColor;
    ctx.fillText("€", cx + 1, cy + 1);

    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.beginPath();
    ctx.arc(cx - coinR * 0.26, cy - coinR * 0.32, coinR * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      if (!isVisible(p.x - 20, p.y - 20, p.w + 40, p.h + 40, 0)) continue;

      if (p.type === "packet") {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#0f2130";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        continue;
      }

      if (p.type === "mailShot") {
        ctx.fillStyle = "#e4f8ff";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#244c66";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.w * 0.5, p.y + p.h * 0.55);
        ctx.lineTo(p.x + p.w, p.y);
        ctx.stroke();
        continue;
      }

      if (p.type === "meetingShot") {
        const centerX = p.x + p.w * 0.5;
        const centerY = p.y + p.h * 0.5;
        const pulse = 1 + Math.sin(worldTime * 14 + centerX * 0.01) * 0.06;

        ctx.fillStyle = "rgba(146, 194, 255, 0.92)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, p.w * 0.42 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1f3557";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 9px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("100+", centerX, centerY + 1);
        continue;
      }

      const centerX = p.x + p.w * 0.5;
      const centerY = p.y + p.h * 0.5;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, p.w * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1b2842";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 9px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("INVITE", centerX, centerY + 1);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      if (!isVisible(p.x - 10, p.y - 10, 20, 20, 0)) continue;

      ctx.globalAlpha = clamp(p.ttl, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawPopups() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const popup of popups) {
      if (!isVisible(popup.x - 60, popup.y - 30, 120, 60, 0)) continue;

      ctx.globalAlpha = clamp(popup.ttl * 1.4, 0, 1);
      ctx.fillStyle = popup.color;
      ctx.font = "800 18px Impact, Haettenschweiler, sans-serif";
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawLabel(text, x, y, color) {
    ctx.font = "800 12px Trebuchet MS, sans-serif";
    const width = Math.max(62, Math.ceil(ctx.measureText(text).width + 18));

    ctx.fillStyle = "rgba(7, 17, 26, 0.65)";
    ctx.fillRect(x - width * 0.5, y - 11, width, 18);

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y - 1);
  }

  function drawHpBar(x, y, w, h, ratio) {
    ctx.fillStyle = "#102132";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "#ffb36f";
    ctx.fillRect(x + 1, y + 1, (w - 2) * clamp(ratio, 0, 1), h - 2);

    ctx.strokeStyle = "#1f384b";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function drawProgressPanel() {
    const progress = getProgress();

    const panelW = Math.min(460, canvas.width - 28);
    const panelH = 58;
    const x = (canvas.width - panelW) * 0.5;
    const y = canvas.height - panelH - 16;

    ctx.fillStyle = "rgba(4, 13, 22, 0.8)";
    ctx.fillRect(x, y, panelW, panelH);

    ctx.strokeStyle = "rgba(118, 211, 244, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, panelW, panelH);

    const barX = x + 12;
    const barY = y + 28;
    const barW = panelW - 24;
    const barH = 12;

    ctx.fillStyle = "#13354c";
    ctx.fillRect(barX, barY, barW, barH);

    const fill = barW * progress;
    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, "#77f8bb");
    grad.addColorStop(1, "#4bd4ff");
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fill, barH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 12px Trebuchet MS, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("09:00", barX, y + 16);

    ctx.textAlign = "center";
    ctx.fillText(
      `FUGA ORIZZONTALE - ARMA: ${PLAYER_FIRE_MODES[playerFireMode].label}`,
      x + panelW * 0.5,
      y + 16
    );

    ctx.textAlign = "right";
    ctx.fillText("17:00", barX + barW, y + 16);
  }

  function drawScreenFx() {
    const vignette = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.height * 0.1,
      canvas.width * 0.5,
      canvas.height * 0.5,
      canvas.width * 0.72
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.48)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(145, 200, 224, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 0.5; y < canvas.height; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function isVisible(x, y, w, h, pad = 0) {
    return !(
      x + w < camera.x - pad ||
      x > camera.x + canvas.width + pad ||
      y + h < camera.y - pad ||
      y > camera.y + canvas.height + pad
    );
  }

  function aabbOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function rangeOverlap(a1, a2, b1, b2) {
    return a1 < b2 && a2 > b1;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getViewportSize() {
    const viewport = window.visualViewport;
    const rawW = viewport ? viewport.width : window.innerWidth;
    const rawH = viewport ? viewport.height : window.innerHeight;

    return {
      width: Math.max(320, Math.round(rawW)),
      height: Math.max(320, Math.round(rawH)),
    };
  }

  function setTouchControlsEnabled(enabled) {
    const nextEnabled = Boolean(enabled);
    if (touchControlsEnabled === nextEnabled) {
      touchUI.setAttribute("aria-hidden", nextEnabled ? "false" : "true");
      return;
    }

    touchControlsEnabled = nextEnabled;
    touchUI.setAttribute("aria-hidden", touchControlsEnabled ? "false" : "true");

    if (!touchControlsEnabled) {
      resetTouchPad();
      touchAttackState.active = false;
      touchAttackState.pointerId = null;
      touchJumpState.active = false;
      touchJumpState.pointerId = null;
    }
  }

  function refreshResponsiveUiMode() {
    setTouchControlsEnabled(touchModeQuery.matches);
  }

  function resize() {
    const viewport = getViewportSize();
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    document.documentElement.style.setProperty("--app-height", `${viewport.height}px`);
    refreshResponsiveUiMode();
    camera.y = getFixedCameraY();
  }

  function gameLoop(ts) {
    const dt = Math.min(0.033, (ts - lastFrame) / 1000);
    lastFrame = ts;

    if (gameState === "playing") {
      update(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", resize);
  }

  if (typeof touchModeQuery.addEventListener === "function") {
    touchModeQuery.addEventListener("change", refreshResponsiveUiMode);
  } else if (typeof touchModeQuery.addListener === "function") {
    touchModeQuery.addListener(refreshResponsiveUiMode);
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    if (gameState !== "playing") return;

    const isGameplayKey =
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      event.code === "ShiftLeft" ||
      event.code === "ShiftRight";
    if (isGameplayKey) {
      event.preventDefault();
    }

    if (HELD_INPUT_CODES.has(event.code)) {
      keys.add(event.code);
    }

    if (event.code === "Space") {
      attackQueued = true;
      event.preventDefault();
    }

    if (event.code === "ArrowUp") {
      jumpQueued = true;
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (
      gameState === "playing" &&
      (event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "ArrowUp" ||
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight")
    ) {
      event.preventDefault();
    }

    if (HELD_INPUT_CODES.has(event.code)) {
      keys.delete(event.code);
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (gameState !== "playing") return;
    event.preventDefault();
    unlockAudioFromGesture();
    attackQueued = true;
  });

  touchPad.addEventListener("pointerdown", (event) => {
    if (gameState !== "playing") return;

    unlockAudioFromGesture();
    touchMove.active = true;
    touchMove.pointerId = event.pointerId;
    touchPad.setPointerCapture(event.pointerId);
    updateTouchVector(event.clientX, event.clientY);
    event.preventDefault();
  });

  touchPad.addEventListener("pointermove", (event) => {
    if (!touchMove.active || touchMove.pointerId !== event.pointerId) return;
    updateTouchVector(event.clientX, event.clientY);
    event.preventDefault();
  });

  touchPad.addEventListener("pointerup", (event) => {
    if (touchMove.pointerId !== event.pointerId) return;
    resetTouchPad();
    event.preventDefault();
  });

  touchPad.addEventListener("pointercancel", (event) => {
    if (touchMove.pointerId !== event.pointerId) return;
    resetTouchPad();
    event.preventDefault();
  });

  touchAttack.addEventListener("pointerdown", (event) => {
    if (gameState !== "playing") return;

    unlockAudioFromGesture();
    touchAttackState.active = true;
    touchAttackState.pointerId = event.pointerId;
    touchAttack.setPointerCapture(event.pointerId);

    attackQueued = true;
    event.preventDefault();
  });

  touchAttack.addEventListener("pointerup", (event) => {
    if (touchAttackState.pointerId !== event.pointerId) return;
    touchAttackState.active = false;
    touchAttackState.pointerId = null;
    event.preventDefault();
  });

  touchAttack.addEventListener("pointercancel", (event) => {
    if (touchAttackState.pointerId !== event.pointerId) return;
    touchAttackState.active = false;
    touchAttackState.pointerId = null;
    event.preventDefault();
  });

  touchJump?.addEventListener("pointerdown", (event) => {
    if (gameState !== "playing") return;

    unlockAudioFromGesture();
    touchJumpState.active = true;
    touchJumpState.pointerId = event.pointerId;
    touchJump.setPointerCapture(event.pointerId);

    jumpQueued = true;
    event.preventDefault();
  });

  touchJump?.addEventListener("pointerup", (event) => {
    if (touchJumpState.pointerId !== event.pointerId) return;
    touchJumpState.active = false;
    touchJumpState.pointerId = null;
    event.preventDefault();
  });

  touchJump?.addEventListener("pointercancel", (event) => {
    if (touchJumpState.pointerId !== event.pointerId) return;
    touchJumpState.active = false;
    touchJumpState.pointerId = null;
    event.preventDefault();
  });

  function updateTouchVector(clientX, clientY) {
    const rect = touchPad.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;

    const dx = clientX - cx;
    const dy = clientY - cy;

    const max = rect.width * 0.36;
    const len = Math.hypot(dx, dy) || 1;

    const px = (dx / len) * Math.min(len, max);
    const py = (dy / len) * Math.min(len, max);

    touchMove.x = clamp(px / max, -1, 1);
    touchMove.y = clamp(py / max, -1, 1);

    if (touchMove.y < -0.72) {
      jumpQueued = true;
    }

    touchKnob.style.transform = `translate(${px}px, ${py}px)`;
  }

  function resetTouchPad() {
    touchMove.active = false;
    touchMove.pointerId = null;
    touchMove.x = 0;
    touchMove.y = 0;
    touchKnob.style.transform = "translate(0px, 0px)";
  }

  let lastTouchStartTs = 0;
  let lastTouchEndTs = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  const isEditableTarget = (target) =>
    target instanceof Element &&
    target.closest("input, textarea, select, [contenteditable='true']");

  // Robust mobile anti-zoom (iOS Safari/Chrome):
  // - blocks double-tap zoom
  // - blocks pinch/gesture zoom
  document.addEventListener(
    "touchstart",
    (event) => {
      if (isEditableTarget(event.target)) return;

      if (event.touches.length > 1) {
        event.preventDefault();
        return;
      }

      const now = performance.now();
      if (now - lastTouchStartTs < 360) {
        event.preventDefault();
      }
      lastTouchStartTs = now;
    },
    { passive: false, capture: true }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      if (isEditableTarget(event.target)) {
        lastTouchEndTs = performance.now();
        return;
      }

      const now = performance.now();
      const touch = event.changedTouches && event.changedTouches[0];
      const px = touch ? touch.clientX : lastTouchX;
      const py = touch ? touch.clientY : lastTouchY;
      const dt = now - lastTouchEndTs;
      const dist = Math.hypot(px - lastTouchX, py - lastTouchY);

      if (dt > 0 && dt < 380 && dist < 28 && event.cancelable) {
        event.preventDefault();
      }

      lastTouchEndTs = now;
      lastTouchX = px;
      lastTouchY = py;
    },
    { passive: false, capture: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (isEditableTarget(event.target)) return;
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false, capture: true }
  );

  document.addEventListener(
    "dblclick",
    (event) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    },
    { passive: false, capture: true }
  );

  const stopGestureZoom = (event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
  };
  document.addEventListener("gesturestart", stopGestureZoom, { passive: false, capture: true });
  document.addEventListener("gesturechange", stopGestureZoom, { passive: false, capture: true });
  document.addEventListener("gestureend", stopGestureZoom, { passive: false, capture: true });

  bindStartButton(document.getElementById("start-btn"));
  musicToggleBtn?.addEventListener("click", () => {
    unlockAudioFromGesture();
    toggleMusic();
  });
  weaponToggleBtn?.addEventListener("click", () => cycleWeaponMode(true));
  genderMaleBtn?.addEventListener("click", () => setPlayerGender("male"));
  genderFemaleBtn?.addEventListener("click", () => setPlayerGender("female"));

  nameInputEl?.addEventListener("input", () => {
    const draft = sanitizePlayerName(nameInputEl.value, "");
    if (nameInputEl.value !== draft) {
      nameInputEl.value = draft;
    }
    if (draft) {
      playerProfile.name = draft;
    }
    updateHud();
  });

  nameInputEl?.addEventListener("blur", () => {
    playerProfile.name = sanitizePlayerName(nameInputEl.value);
    nameInputEl.value = playerProfile.name;
    rememberPlayerName();
    updateHud();
  });

  difficultySelectEl?.addEventListener("change", () => {
    applyDifficultyFromSetup();
    updateHud();
  });

  for (const type in enemyLabelInputs) {
    const inputEl = enemyLabelInputs[type];
    if (!inputEl) continue;

    const fallback = getEnemyLabelFallback(type);
    inputEl.value = enemyLabelProfile[type] || fallback;

    inputEl.addEventListener("input", () => {
      const draft = sanitizeEnemyLabel(inputEl.value, "");
      if (inputEl.value !== draft) {
        inputEl.value = draft;
      }
      if (draft) {
        enemyLabelProfile[type] = draft;
      }
    });

    inputEl.addEventListener("blur", () => {
      const normalized = sanitizeEnemyLabel(inputEl.value, fallback);
      inputEl.value = normalized;
      enemyLabelProfile[type] = normalized;
    });
  }

  loadRememberedPlayerName();
  playerServerId = ensurePlayerServerId();
  setDifficultyLevel(difficultySelectEl ? difficultySelectEl.value : difficultyLevel);
  rememberPlayerName();

  if (nameInputEl) {
    nameInputEl.value = playerProfile.name;
  }
  applyEnemyLabelsFromSetup();
  refreshGenderButtons();
  refreshResponsiveUiMode();

  initMusicSystem();
  resize();
  updateHud();
  void refreshServerLeaderboard();
  requestAnimationFrame(gameLoop);
})();
