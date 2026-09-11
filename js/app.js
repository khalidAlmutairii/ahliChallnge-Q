import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { QUESTION_BANK } from "./questions.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

const modeCards = document.querySelectorAll(".mode-card");
const playerModal = document.getElementById("playerModal");
const matchModal = document.getElementById("matchModal");
const codeModal = document.getElementById("codeModal");
const lobbyModal = document.getElementById("lobbyModal");

const playerModalTitle = document.getElementById("playerModalTitle");
const playerModalText = document.getElementById("playerModalText");
const playerNameInput = document.getElementById("playerName");
const selectedModeLabel = document.getElementById("selectedModeLabel");

const playNowBtn = document.getElementById("playNowBtn");
const joinCodeBtn = document.getElementById("joinCodeBtn");
const topLoginBtn = document.getElementById("topLoginBtn");

const confirmPlayBtn = document.getElementById("confirmPlayBtn");
const closePlayerModal = document.getElementById("closePlayerModal");

const cancelMatchBtn = document.getElementById("cancelMatchBtn");
const cancelSearchBtn = document.getElementById("cancelSearchBtn");

const closeCodeModal = document.getElementById("closeCodeModal");
const joinRoomConfirm = document.getElementById("joinRoomConfirm");
const roomCodeInput = document.getElementById("roomCode");

const matchTitle = document.getElementById("matchTitle");
const matchText = document.getElementById("matchText");
const searchStatusText = document.getElementById("searchStatusText");

const lobbyRoomCode = document.getElementById("lobbyRoomCode");
const lobbyMode = document.getElementById("lobbyMode");
const lobbyStatus = document.getElementById("lobbyStatus");
const lobbyPlayers = document.getElementById("lobbyPlayers");
const readyBtn = document.getElementById("readyBtn");
const startGameBtn = document.getElementById("startGameBtn");
const leaveLobbyBtn = document.getElementById("leaveLobbyBtn");

const toast = document.getElementById("toast");
const gameOverlay = document.getElementById("gameOverlay");
const gameRoomCode = document.getElementById("gameRoomCode");
const roundLabel = document.getElementById("roundLabel");
const timerProgress = document.getElementById("timerProgress");
const myScore = document.getElementById("myScore");
const gamePlayersList = document.getElementById("gamePlayersList");
const questionCategory = document.getElementById("questionCategory");
const countdownCircle = document.getElementById("countdownCircle");
const questionMedia = document.getElementById("questionMedia");
const liveQuestionText = document.getElementById("liveQuestionText");
const liveAnswers = document.getElementById("liveAnswers");
const answerFeedback = document.getElementById("answerFeedback");

const resultsModal = document.getElementById("resultsModal");
const resultsTitle = document.getElementById("resultsTitle");
const resultsSubtitle = document.getElementById("resultsSubtitle");
const resultsList = document.getElementById("resultsList");
const backHomeBtn = document.getElementById("backHomeBtn");


let selectedMode = "solo";
let currentUser = null;
let currentRoomId = null;
let currentRoomUnsubscribeRef = null;
let matchmakingTimer = null;
let ticketWatchRef = null;
let gameTimerInterval = null;
let hostGameMonitor = null;
let lastRenderedQuestionIndex = -1;
let currentRoomSnapshot = null;

const QUESTION_TIME_MS = 15000;

// بنك أسئلة تجريبي. لاحقاً ننقله إلى Firebase/Admin Panel.
const QUESTIONS_BY_ID = Object.fromEntries(
  QUESTION_BANK.map((q) => [q.id, q])
);

function getRandomQuestionIds(count = 10) {
  const ids = QUESTION_BANK.map((q) => q.id);

  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids.slice(0, Math.min(count, ids.length));
}


const modeLabels = {
  solo: "العب لحالك",
  quick1v1: "خصم عشوائي 1 ضد 1",
  quick2v2: "2 ضد 2 عشوائي",
  private: "غرفة خاصة"
};

const modeNeededPlayers = {
  quick1v1: 2,
  quick2v2: 4
};

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    modeCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    selectedMode = card.dataset.mode;
    selectedModeLabel.textContent = modeLabels[selectedMode];
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4200);
}

async function ensureAuth() {
  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }

  try {
    const result = await signInAnonymously(auth);
    currentUser = result.user;
    return currentUser;
  } catch (error) {
    console.error(error);
    if (error.code === "auth/operation-not-allowed") {
      throw new Error("فعّل Anonymous Authentication من Firebase أولاً.");
    }
    throw new Error("تعذر تسجيل الدخول إلى Firebase.");
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
});

function openPlayerModal() {
  selectedModeLabel.textContent = modeLabels[selectedMode];

  if (selectedMode === "quick1v1") {
    playerModalTitle.textContent = "ابحث عن خصم عشوائي";
    playerModalText.textContent = "اكتب اسمك وسنبحث عن لاعب آخر موجود أونلاين.";
  } else if (selectedMode === "quick2v2") {
    playerModalTitle.textContent = "ادخل مباراة 2 ضد 2";
    playerModalText.textContent = "اكتب اسمك وسنجمع أربعة لاعبين ونقسمهم إلى فريقين.";
  } else if (selectedMode === "private") {
    playerModalTitle.textContent = "إنشاء غرفة خاصة";
    playerModalText.textContent = "اكتب اسمك وسننشئ لك غرفة مع كود ترسله لأصحابك.";
  } else {
    playerModalTitle.textContent = "جاهز للتحدي؟";
    playerModalText.textContent = "اكتب اسمك وابدأ اللعب الفردي.";
  }

  playerModal.classList.add("show");
  setTimeout(() => playerNameInput.focus(), 100);
}

playNowBtn.addEventListener("click", openPlayerModal);
topLoginBtn.addEventListener("click", openPlayerModal);

joinCodeBtn.addEventListener("click", () => {
  codeModal.classList.add("show");
  setTimeout(() => roomCodeInput.focus(), 100);
});

closePlayerModal.addEventListener("click", () => playerModal.classList.remove("show"));
closeCodeModal.addEventListener("click", () => codeModal.classList.remove("show"));

[playerModal, codeModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("show");
  });
});

confirmPlayBtn.addEventListener("click", async () => {
  const playerName = playerNameInput.value.trim();

  if (!playerName) {
    showToast("اكتب اسم اللاعب أولاً.");
    return;
  }

  localStorage.setItem("ahli_player_name", playerName);
  playerModal.classList.remove("show");

  try {
    await ensureAuth();

    if (selectedMode === "quick1v1" || selectedMode === "quick2v2") {
      await startQuickMatch(playerName, selectedMode);
      return;
    }

    if (selectedMode === "private") {
      await createPrivateRoom(playerName);
      return;
    }

    await createSoloGame(playerName);
  } catch (error) {
    console.error(error);
    showToast(error.message || "حدث خطأ في Firebase.");
  }
});


async function createSoloGame(playerName) {
  const roomRef = push(ref(db, "rooms"));
  const roomId = roomRef.key;
  const uid = currentUser.uid;
  const questionIds = getRandomQuestionIds(10);

  await set(roomRef, {
    code: "SOLO",
    mode: "solo",
    hostUid: uid,
    status: "game",
    createdAt: serverTimestamp(),
    startedAt: Date.now(),
    players: {
      [uid]: {
        uid,
        name: playerName,
        team: 1,
        ready: true,
        joinedAt: serverTimestamp()
      }
    },
    scores: {
      [uid]: 0
    },
    game: {
      status: "playing",
      questionIds,
      currentIndex: 0,
      questionStartedAt: Date.now(),
      questionDurationMs: QUESTION_TIME_MS
    }
  });

  openLobby(roomId);
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AH";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createPrivateRoom(playerName) {
  const roomRef = push(ref(db, "rooms"));
  const roomId = roomRef.key;
  const code = generateRoomCode();
  const uid = currentUser.uid;

  const room = {
    code,
    mode: "private",
    hostUid: uid,
    status: "lobby",
    createdAt: serverTimestamp(),
    players: {
      [uid]: {
        uid,
        name: playerName,
        team: 1,
        ready: false,
        joinedAt: serverTimestamp()
      }
    }
  };

  const updates = {};
  updates[`rooms/${roomId}`] = room;
  updates[`roomCodes/${code}`] = roomId;

  await update(ref(db), updates);
  openLobby(roomId);
}

joinRoomConfirm.addEventListener("click", async () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  const playerName = playerNameInput.value.trim() || localStorage.getItem("ahli_player_name") || "";

  if (code.length < 4) {
    showToast("اكتب كود غرفة صحيح.");
    return;
  }

  if (!playerName) {
    codeModal.classList.remove("show");
    selectedMode = "private";
    selectedModeLabel.textContent = modeLabels.private;
    playerModalTitle.textContent = "اكتب اسمك أولاً";
    playerModalText.textContent = "بعد كتابة الاسم اضغط متابعة، ثم ادخل كود الغرفة مرة ثانية.";
    playerModal.classList.add("show");
    return;
  }

  try {
    await ensureAuth();

    const codeSnap = await get(ref(db, `roomCodes/${code}`));
    if (!codeSnap.exists()) {
      showToast("ما لقينا غرفة بهذا الكود.");
      return;
    }

    const roomId = codeSnap.val();
    const roomSnap = await get(ref(db, `rooms/${roomId}`));

    if (!roomSnap.exists()) {
      showToast("الغرفة لم تعد موجودة.");
      return;
    }

    const room = roomSnap.val();
    const players = room.players ? Object.values(room.players) : [];

    if (players.length >= 4) {
      showToast("الغرفة ممتلئة.");
      return;
    }

    const team1 = players.filter((p) => p.team === 1).length;
    const team2 = players.filter((p) => p.team === 2).length;
    const team = team1 <= team2 ? 1 : 2;

    await set(ref(db, `rooms/${roomId}/players/${currentUser.uid}`), {
      uid: currentUser.uid,
      name: playerName,
      team,
      ready: false,
      joinedAt: serverTimestamp()
    });

    codeModal.classList.remove("show");
    openLobby(roomId);
  } catch (error) {
    console.error(error);
    showToast(error.message || "تعذر دخول الغرفة.");
  }
});

async function startQuickMatch(playerName, mode) {
  matchModal.classList.add("show");

  const isTeam = mode === "quick2v2";
  matchTitle.textContent = isTeam ? "جاري البحث عن لاعبين..." : "جاري البحث عن خصم...";
  matchText.textContent = isTeam
    ? "نبحث عن 3 لاعبين آخرين لتكوين فريقين."
    : "نبحث عن لاعب مناسب لك الآن.";
  searchStatusText.textContent = "متصل بـ Firebase • البحث...";

  const uid = currentUser.uid;
  const ticketRef = ref(db, `queues/${mode}/${uid}`);

  await set(ticketRef, {
    uid,
    name: playerName,
    status: "waiting",
    createdAt: Date.now(),
    matchedRoom: null
  });

  watchOwnTicket(mode, uid);

  await tryMatch(mode, uid);
  matchmakingTimer = setInterval(() => tryMatch(mode, uid), 2500);
}

function watchOwnTicket(mode, uid) {
  if (ticketWatchRef) off(ticketWatchRef);

  ticketWatchRef = ref(db, `queues/${mode}/${uid}`);

  onValue(ticketWatchRef, (snap) => {
    if (!snap.exists()) return;

    const ticket = snap.val();

    if (ticket.status === "reserved") {
      searchStatusText.textContent = "تم العثور على اللاعبين • جارٍ إنشاء الغرفة...";
    }

    if (ticket.status === "matched" && ticket.matchedRoom) {
      clearInterval(matchmakingTimer);
      matchmakingTimer = null;

      matchTitle.textContent = "تم العثور على المباراة!";
      matchText.textContent = "جاري الدخول إلى غرفة المباراة...";
      searchStatusText.textContent = "تمت المطابقة ✓";

      setTimeout(() => {
        matchModal.classList.remove("show");
        openLobby(ticket.matchedRoom);
      }, 350);
    }
  });
}

async function tryMatch(mode, uid) {
  const needed = modeNeededPlayers[mode];
  if (!needed) return;

  const queueRootRef = ref(db, `queues/${mode}`);

  // أنشئ Room ID مسبقاً بدون كتابة الغرفة الآن.
  const pendingRoomRef = push(ref(db, "rooms"));
  const pendingRoomId = pendingRoomRef.key;

  let reservedPlayers = null;

  // Transaction واحد على كامل طابور هذا النوع.
  // هذا يمنع التعارض بين متصفحين يحاولان تكوين نفس المباراة.
  const tx = await runTransaction(queueRootRef, (queue) => {
    if (!queue) return queue;

    const waiting = Object.values(queue)
      .filter((ticket) =>
        ticket &&
        ticket.status === "waiting" &&
        !ticket.matchedRoom &&
        !ticket.reservedRoom
      )
      .sort((a, b) => {
        const dt = (a.createdAt || 0) - (b.createdAt || 0);
        if (dt !== 0) return dt;
        return String(a.uid).localeCompare(String(b.uid));
      });

    if (waiting.length < needed) {
      return queue;
    }

    // أقدم لاعب فقط يحق له تكوين المباراة.
    if (waiting[0].uid !== uid) {
      return queue;
    }

    const selected = waiting.slice(0, needed);

    selected.forEach((player) => {
      if (!queue[player.uid]) return;

      queue[player.uid] = {
        ...queue[player.uid],
        status: "reserved",
        reservedRoom: pendingRoomId,
        reservedBy: uid
      };
    });

    reservedPlayers = selected.map((p) => ({
      uid: p.uid,
      name: p.name
    }));

    return queue;
  });

  // لو لم يتم حجز مجموعة، لا يوجد شيء نسويه الآن.
  if (!tx.committed || !reservedPlayers || reservedPlayers.length !== needed) {
    return;
  }

  const code = generateRoomCode();
  const playersObject = {};

  reservedPlayers.forEach((player, index) => {
    let team = 1;

    if (mode === "quick2v2") {
      team = index < 2 ? 1 : 2;
    }

    playersObject[player.uid] = {
      uid: player.uid,
      name: player.name,
      team,
      ready: false,
      joinedAt: serverTimestamp()
    };
  });

  const room = {
    code,
    mode,
    hostUid: uid,
    status: "lobby",
    createdAt: serverTimestamp(),
    players: playersObject
  };

  // أهم خطوة:
  // إنشاء الغرفة + تحويل كل اللاعبين إلى matched في Update واحد.
  const updates = {};
  updates[`rooms/${pendingRoomId}`] = room;
  updates[`roomCodes/${code}`] = pendingRoomId;

  for (const player of reservedPlayers) {
    updates[`queues/${mode}/${player.uid}/status`] = "matched";
    updates[`queues/${mode}/${player.uid}/matchedRoom`] = pendingRoomId;
    updates[`queues/${mode}/${player.uid}/reservedRoom`] = null;
    updates[`queues/${mode}/${player.uid}/reservedBy`] = null;
  }

  try {
    await update(ref(db), updates);
  } catch (error) {
    console.error("Failed to create matched room:", error);

    // لو فشل إنشاء الغرفة، رجع التذاكر إلى waiting بدل ما تعلق reserved.
    const rollback = {};
    for (const player of reservedPlayers) {
      rollback[`queues/${mode}/${player.uid}/status`] = "waiting";
      rollback[`queues/${mode}/${player.uid}/reservedRoom`] = null;
      rollback[`queues/${mode}/${player.uid}/reservedBy`] = null;
    }
    await update(ref(db), rollback);

    throw error;
  }
}

async function stopSearch() {
  clearInterval(matchmakingTimer);
  matchmakingTimer = null;

  if (currentUser && (selectedMode === "quick1v1" || selectedMode === "quick2v2")) {
    const ticketRef = ref(db, `queues/${selectedMode}/${currentUser.uid}`);
    const snap = await get(ticketRef);

    if (snap.exists()) {
      const ticket = snap.val();
      if (ticket.status === "waiting" && !ticket.matchedRoom) {
        await remove(ticketRef);
      }
    }
  }

  matchModal.classList.remove("show");
}

cancelMatchBtn.addEventListener("click", stopSearch);
cancelSearchBtn.addEventListener("click", stopSearch);

function openLobby(roomId) {
  currentRoomId = roomId;
  lobbyModal.classList.add("show");

  if (currentRoomUnsubscribeRef) off(currentRoomUnsubscribeRef);

  currentRoomUnsubscribeRef = ref(db, `rooms/${roomId}`);

  onValue(currentRoomUnsubscribeRef, (snap) => {
    if (!snap.exists()) {
      lobbyModal.classList.remove("show");
      gameOverlay.classList.remove("show");
      showToast("تم إغلاق الغرفة.");
      return;
    }

    currentRoomSnapshot = snap.val();

    if (currentRoomSnapshot.status === "game" && currentRoomSnapshot.game) {
      lobbyModal.classList.remove("show");
      startGameUI(currentRoomSnapshot);
      return;
    }

    if (currentRoomSnapshot.status === "finished") {
      lobbyModal.classList.remove("show");
      gameOverlay.classList.remove("show");
      renderResults(currentRoomSnapshot);
      return;
    }

    renderLobby(currentRoomSnapshot);
  });
}

function renderLobby(room) {
  const players = room.players ? Object.values(room.players) : [];
  lobbyRoomCode.textContent = room.code || "------";
  lobbyMode.textContent = modeLabels[room.mode] || "غرفة خاصة";

  if (room.status === "game") {
    lobbyStatus.textContent = "بدأت المباراة";
  } else {
    lobbyStatus.textContent = `${players.length} لاعب في الغرفة`;
  }

  lobbyPlayers.innerHTML = "";

  players
    .sort((a, b) => (a.team || 1) - (b.team || 1))
    .forEach((player) => {
      const card = document.createElement("div");
      card.className = "lobby-player";

      const initial = (player.name || "?").charAt(0).toUpperCase();
      const isMe = currentUser && player.uid === currentUser.uid;

      card.innerHTML = `
        <div class="lobby-avatar">${escapeHtml(initial)}</div>
        <div class="lobby-player-info">
          <strong>${escapeHtml(player.name)} ${isMe ? "(أنت)" : ""}</strong>
          <small class="team-label">الفريق ${player.team || 1}</small>
        </div>
        <span class="${player.ready ? "ready-badge" : "waiting-badge"}">
          ${player.ready ? "جاهز ✓" : "غير جاهز"}
        </span>
      `;

      lobbyPlayers.appendChild(card);
    });

  const me = currentUser && room.players ? room.players[currentUser.uid] : null;
  readyBtn.textContent = me && me.ready ? "إلغاء الجاهزية" : "أنا جاهز";

  const isHost = currentUser && room.hostUid === currentUser.uid;
  const requiredPlayers =
    room.mode === "quick2v2" ? 4 :
    room.mode === "quick1v1" ? 2 :
    room.mode === "solo" ? 1 :
    (players.length === 2 || players.length === 4 ? players.length : 99);

  const allReady =
    players.length === requiredPlayers &&
    players.every((p) => p.ready);

  startGameBtn.hidden = !isHost;
  startGameBtn.disabled = !allReady;

  if (isHost) {
    startGameBtn.textContent = allReady
      ? "بدء اللعبة"
      : (room.mode === "private" && players.length === 3
          ? "الغرفة الخاصة تحتاج 2 أو 4 لاعبين"
          : "بانتظار جاهزية اللاعبين");
    startGameBtn.style.opacity = allReady ? "1" : ".55";
  }

  if (room.status === "game" && room.game) {
    lobbyModal.classList.remove("show");
    startGameUI(room);
  }

  if (room.status === "finished") {
    lobbyModal.classList.remove("show");
    gameOverlay.classList.remove("show");
    renderResults(room);
  }
}

readyBtn.addEventListener("click", async () => {
  if (!currentRoomId || !currentUser) return;

  const readyRef = ref(db, `rooms/${currentRoomId}/players/${currentUser.uid}/ready`);
  const snap = await get(readyRef);
  await set(readyRef, !(snap.exists() && snap.val() === true));
});

startGameBtn.addEventListener("click", async () => {
  if (!currentRoomId || !currentUser) return;

  const roomRef = ref(db, `rooms/${currentRoomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return;

  const room = snap.val();

  if (room.hostUid !== currentUser.uid) return;

  const players = room.players ? Object.values(room.players) : [];
  const requiredPlayers =
    room.mode === "quick2v2" ? 4 :
    room.mode === "quick1v1" ? 2 :
    room.mode === "solo" ? 1 :
    (players.length === 2 || players.length === 4 ? players.length : 99);

  const allReady =
    players.length === requiredPlayers &&
    players.every((p) => p.ready);

  if (!allReady) {
    showToast("لازم كل اللاعبين يكونون جاهزين.");
    return;
  }

  // في النسخة الحالية نستخدم كل 10 أسئلة بالترتيب.
  // لاحقاً نقدر نسحبها عشوائياً من Firebase.
  const questionIds = getRandomQuestionIds(10);

  const scoreUpdates = {};
  players.forEach((player) => {
    scoreUpdates[`scores/${player.uid}`] = 0;
  });

  await update(roomRef, {
    status: "game",
    startedAt: Date.now(),
    game: {
      status: "playing",
      questionIds,
      currentIndex: 0,
      questionStartedAt: Date.now(),
      questionDurationMs: QUESTION_TIME_MS
    },
    answers: null,
    ...scoreUpdates
  });
});

leaveLobbyBtn.addEventListener("click", async () => {
  if (!currentRoomId || !currentUser) {
    lobbyModal.classList.remove("show");
    return;
  }

  const roomId = currentRoomId;
  const roomRef = ref(db, `rooms/${roomId}`);
  const roomSnap = await get(roomRef);

  if (roomSnap.exists()) {
    const room = roomSnap.val();
    await remove(ref(db, `rooms/${roomId}/players/${currentUser.uid}`));

    if (room.hostUid === currentUser.uid) {
      const afterSnap = await get(roomRef);
      if (afterSnap.exists()) {
        const remaining = afterSnap.val().players ? Object.values(afterSnap.val().players) : [];
        if (remaining.length > 0) {
          await update(roomRef, { hostUid: remaining[0].uid });
        } else {
          await remove(ref(db, `roomCodes/${room.code}`));
          await remove(roomRef);
        }
      }
    }
  }

  if (currentRoomUnsubscribeRef) off(currentRoomUnsubscribeRef);
  currentRoomUnsubscribeRef = null;
  currentRoomId = null;
  lobbyModal.classList.remove("show");
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function startGameUI(room) {
  currentRoomSnapshot = room;
  gameOverlay.classList.add("show");

  renderGamePlayers(room);
  renderCurrentQuestion(room);

  if (room.hostUid === currentUser?.uid) {
    startHostGameMonitor();
  } else {
    stopHostGameMonitor();
  }
}

function renderGamePlayers(room) {
  const players = room.players ? Object.values(room.players) : [];
  const scores = room.scores || {};

  gamePlayersList.innerHTML = "";

  players
    .sort((a, b) => (scores[b.uid] || 0) - (scores[a.uid] || 0))
    .forEach((player) => {
      const row = document.createElement("div");
      row.className = "game-player-row" + (player.uid === currentUser?.uid ? " me" : "");

      const initial = escapeHtml((player.name || "?").charAt(0).toUpperCase());

      row.innerHTML = `
        <div class="lobby-avatar">${initial}</div>
        <div class="game-player-data">
          <strong>${escapeHtml(player.name)} ${player.uid === currentUser?.uid ? "(أنت)" : ""}</strong>
          <small>الفريق ${player.team || 1}</small>
        </div>
        <div class="game-player-points">${scores[player.uid] || 0}</div>
      `;

      gamePlayersList.appendChild(row);
    });

  myScore.textContent = scores[currentUser?.uid] || 0;
}

function renderCurrentQuestion(room) {
  if (!room.game || room.game.status !== "playing") return;

  const ids = room.game.questionIds || [];
  const index = room.game.currentIndex || 0;
  const questionId = ids[index];
  const question = QUESTIONS_BY_ID[questionId];

  if (!question) {
    liveQuestionText.textContent = "تعذر تحميل السؤال.";
    return;
  }

  gameRoomCode.textContent = room.code || "------";
  roundLabel.textContent = `الجولة ${index + 1} / ${ids.length}`;
  questionCategory.textContent = question.category || "تحدي";

  if (lastRenderedQuestionIndex !== index) {
    lastRenderedQuestionIndex = index;
    answerFeedback.textContent = "";
    answerFeedback.className = "answer-feedback";
    renderQuestionMedia(question);
    liveQuestionText.textContent = question.question;
    renderAnswerButtons(question, room, index);
  } else {
    // تحديث الإجابات/الحالة لو نفس السؤال
    updateAnswerState(question, room, index);
  }

  renderGamePlayers(room);
  startLocalQuestionTimer(room);
}

function renderQuestionMedia(question) {
  questionMedia.className = "question-media";

  if (question.type === "image" && question.mediaUrl) {
    questionMedia.innerHTML = `<img src="${escapeHtml(question.mediaUrl)}" alt="صورة السؤال">`;
    return;
  }

  if (question.type === "audio" && question.mediaUrl) {
    questionMedia.innerHTML = `<audio controls src="${escapeHtml(question.mediaUrl)}"></audio>`;
    return;
  }

  questionMedia.classList.add("text-media");
  questionMedia.innerHTML = "<span>👑</span>";
}

function renderAnswerButtons(question, room, index) {
  liveAnswers.innerHTML = "";

  question.options.forEach((option, optionIndex) => {
    const btn = document.createElement("button");
    btn.className = "live-answer-btn";
    btn.textContent = option;
    btn.dataset.optionIndex = String(optionIndex);

    btn.addEventListener("click", () => {
      submitAnswer(index, optionIndex);
    });

    liveAnswers.appendChild(btn);
  });

  updateAnswerState(question, room, index);
}

function updateAnswerState(question, room, index) {
  const myAnswer = room.answers?.[index]?.[currentUser?.uid];
  const buttons = [...liveAnswers.querySelectorAll(".live-answer-btn")];

  if (!myAnswer) {
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove("selected", "correct", "wrong");
    });
    return;
  }

  buttons.forEach((btn, buttonIndex) => {
    btn.disabled = true;

    if (buttonIndex === myAnswer.optionIndex) {
      btn.classList.add("selected");
      btn.classList.add(myAnswer.correct ? "correct" : "wrong");
    }

    if (buttonIndex === question.correctIndex && !myAnswer.correct) {
      btn.classList.add("correct");
    }
  });

  if (myAnswer.correct) {
    answerFeedback.textContent = `إجابة صحيحة! +${myAnswer.points || 0} نقطة`;
    answerFeedback.className = "answer-feedback success";
  } else {
    answerFeedback.textContent = "إجابة غير صحيحة. انتظر السؤال التالي.";
    answerFeedback.className = "answer-feedback error";
  }
}

async function submitAnswer(questionIndex, optionIndex) {
  if (!currentRoomId || !currentUser || !currentRoomSnapshot?.game) return;

  const room = currentRoomSnapshot;
  const ids = room.game.questionIds || [];
  const questionId = ids[questionIndex];
  const question = QUESTIONS_BY_ID[questionId];

  if (!question) return;

  const answerRef = ref(db, `rooms/${currentRoomId}/answers/${questionIndex}/${currentUser.uid}`);

  const elapsed = Math.max(0, Date.now() - (room.game.questionStartedAt || Date.now()));
  const duration = room.game.questionDurationMs || QUESTION_TIME_MS;
  const remainingRatio = Math.max(0, 1 - elapsed / duration);

  const correct = optionIndex === question.correctIndex;

  // 500 نقطة ثابتة + حتى 500 حسب السرعة.
  const points = correct
    ? Math.max(500, Math.round(500 + 500 * remainingRatio))
    : 0;

  const tx = await runTransaction(answerRef, (current) => {
    if (current) return current;

    return {
      optionIndex,
      correct,
      points,
      answeredAt: Date.now()
    };
  });

  if (!tx.committed) return;

  if (correct && points > 0) {
    const scoreRef = ref(db, `rooms/${currentRoomId}/scores/${currentUser.uid}`);

    await runTransaction(scoreRef, (currentScore) => {
      return (currentScore || 0) + points;
    });
  }
}

function startLocalQuestionTimer(room) {
  clearInterval(gameTimerInterval);

  const startedAt = room.game?.questionStartedAt || Date.now();
  const duration = room.game?.questionDurationMs || QUESTION_TIME_MS;

  const tick = () => {
    const elapsed = Date.now() - startedAt;
    const remainingMs = Math.max(0, duration - elapsed);
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const ratio = Math.max(0, Math.min(1, remainingMs / duration));

    countdownCircle.textContent = seconds;
    timerProgress.style.width = `${ratio * 100}%`;

    if (remainingMs <= 0) {
      clearInterval(gameTimerInterval);
      gameTimerInterval = null;

      const buttons = [...liveAnswers.querySelectorAll(".live-answer-btn")];
      buttons.forEach((btn) => btn.disabled = true);

      if (!currentRoomSnapshot?.answers?.[currentRoomSnapshot.game.currentIndex]?.[currentUser?.uid]) {
        answerFeedback.textContent = "انتهى الوقت. انتظر السؤال التالي.";
        answerFeedback.className = "answer-feedback error";
      }
    }
  };

  tick();
  gameTimerInterval = setInterval(tick, 150);
}

function startHostGameMonitor() {
  if (hostGameMonitor) return;

  hostGameMonitor = setInterval(async () => {
    if (!currentRoomId || !currentUser || !currentRoomSnapshot) return;

    const room = currentRoomSnapshot;

    if (room.hostUid !== currentUser.uid || room.status !== "game" || !room.game) {
      return;
    }

    const index = room.game.currentIndex || 0;
    const playerCount = room.players ? Object.keys(room.players).length : 0;
    const answersForQuestion = room.answers?.[index] || {};
    const answeredCount = Object.keys(answersForQuestion).length;

    const elapsed = Date.now() - (room.game.questionStartedAt || Date.now());
    const duration = room.game.questionDurationMs || QUESTION_TIME_MS;

    const everyoneAnswered = playerCount > 0 && answeredCount >= playerCount;

    const answerTimes = Object.values(answersForQuestion)
      .map((a) => a?.answeredAt || 0)
      .filter(Boolean);

    const latestAnswerAt = answerTimes.length
      ? Math.max(...answerTimes)
      : 0;

    const feedbackSeen =
      everyoneAnswered &&
      latestAnswerAt > 0 &&
      (Date.now() - latestAnswerAt) >= 1200;

    const timeExpired = elapsed >= duration + 500;

    if (!feedbackSeen && !timeExpired) return;

    await advanceQuestionSafely(index);
  }, 500);
}

function stopHostGameMonitor() {
  clearInterval(hostGameMonitor);
  hostGameMonitor = null;
}

async function advanceQuestionSafely(expectedIndex) {
  if (!currentRoomId) return;

  const gameRef = ref(db, `rooms/${currentRoomId}/game`);

  const tx = await runTransaction(gameRef, (game) => {
    if (!game || game.status !== "playing") return game;
    if ((game.currentIndex || 0) !== expectedIndex) return game;

    const questionIds = game.questionIds || [];
    const nextIndex = expectedIndex + 1;

    if (nextIndex >= questionIds.length) {
      return {
        ...game,
        status: "finished",
        finishedAt: Date.now()
      };
    }

    return {
      ...game,
      currentIndex: nextIndex,
      questionStartedAt: Date.now()
    };
  });

  if (!tx.committed) return;

  const updatedGame = tx.snapshot.val();

  if (updatedGame?.status === "finished") {
    await update(ref(db, `rooms/${currentRoomId}`), {
      status: "finished",
      finishedAt: Date.now()
    });
  }
}

function renderResults(room) {
  clearInterval(gameTimerInterval);
  gameTimerInterval = null;
  stopHostGameMonitor();

  const players = room.players ? Object.values(room.players) : [];
  const scores = room.scores || {};

  resultsList.innerHTML = "";

  if (room.mode === "quick2v2") {
    const team1 = players.filter((p) => p.team === 1);
    const team2 = players.filter((p) => p.team === 2);

    const team1Score = team1.reduce((sum, p) => sum + (scores[p.uid] || 0), 0);
    const team2Score = team2.reduce((sum, p) => sum + (scores[p.uid] || 0), 0);

    let winnerText = "تعادل الفريقان 🤝";
    if (team1Score > team2Score) winnerText = "الفريق الأول فاز 🏆";
    if (team2Score > team1Score) winnerText = "الفريق الثاني فاز 🏆";

    resultsTitle.textContent = winnerText;
    resultsSubtitle.textContent = "النتيجة حسب مجموع نقاط لاعبي كل فريق.";

    const teams = [
      { name: "الفريق الأول", score: team1Score },
      { name: "الفريق الثاني", score: team2Score }
    ].sort((a, b) => b.score - a.score);

    teams.forEach((team, index) => {
      const row = document.createElement("div");
      row.className = "result-row";
      row.innerHTML = `
        <div class="result-rank">${index === 0 ? "🥇" : "2"}</div>
        <strong>${team.name}</strong>
        <div class="result-points">${team.score} نقطة</div>
      `;
      resultsList.appendChild(row);
    });

    const divider = document.createElement("div");
    divider.style.cssText =
      "color:var(--muted);font-size:10px;margin:10px 0 4px;text-align:right;";
    divider.textContent = "تفاصيل اللاعبين";
    resultsList.appendChild(divider);

    [...players]
      .sort((a, b) => (scores[b.uid] || 0) - (scores[a.uid] || 0))
      .forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
          <div class="result-rank">${index + 1}</div>
          <strong>${escapeHtml(player.name)} — الفريق ${player.team} ${player.uid === currentUser?.uid ? "(أنت)" : ""}</strong>
          <div class="result-points">${scores[player.uid] || 0} نقطة</div>
        `;
        resultsList.appendChild(row);
      });

    resultsModal.classList.add("show");
    return;
  }

  const ranked = players
    .map((player) => ({
      ...player,
      score: scores[player.uid] || 0
    }))
    .sort((a, b) => b.score - a.score);

  ranked.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <div class="result-rank">${index + 1}</div>
      <strong>${escapeHtml(player.name)} ${player.uid === currentUser?.uid ? "(أنت)" : ""}</strong>
      <div class="result-points">${player.score} نقطة</div>
    `;
    resultsList.appendChild(row);
  });

  if (room.mode === "solo") {
    resultsTitle.textContent = "انتهى التحدي الفردي 👑";
    resultsSubtitle.textContent =
      `نتيجتك: ${ranked[0]?.score || 0} نقطة من 10 أسئلة عشوائية.`;
  } else if (ranked.length > 0) {
    const winner = ranked[0];
    resultsTitle.textContent = winner.uid === currentUser?.uid
      ? "مبروك! أنت الفائز 🏆"
      : `الفائز: ${winner.name} 🏆`;
    resultsSubtitle.textContent = "النتيجة النهائية بعد 10 جولات.";
  } else {
    resultsTitle.textContent = "انتهت المباراة!";
    resultsSubtitle.textContent = "النتيجة النهائية.";
  }

  resultsModal.classList.add("show");
}

backHomeBtn.addEventListener("click", async () => {
  resultsModal.classList.remove("show");
  gameOverlay.classList.remove("show");

  if (currentRoomUnsubscribeRef) {
    off(currentRoomUnsubscribeRef);
    currentRoomUnsubscribeRef = null;
  }

  currentRoomId = null;
  currentRoomSnapshot = null;
  lastRenderedQuestionIndex = -1;

  window.scrollTo({ top: 0, behavior: "smooth" });
});


const savedName = localStorage.getItem("ahli_player_name");
if (savedName) playerNameInput.value = savedName;
