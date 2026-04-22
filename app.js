const GAME_MODES = {
  bollywood: {
    id: "bollywood",
    label: "Bollywood Celebrities",
    characters: [
      { id: "srk", name: "Shah Rukh Khan", accent: ["#4568dc", "#b06ab3"] },
      { id: "salman", name: "Salman Khan", accent: ["#11998e", "#38ef7d"] },
      { id: "aamir", name: "Aamir Khan", accent: ["#1d2b64", "#f8cdda"] },
      { id: "hrithik", name: "Hrithik Roshan", accent: ["#4b6cb7", "#182848"] },
      { id: "ranbir", name: "Ranbir Kapoor", accent: ["#c33764", "#1d2671"] },
      { id: "ranveer", name: "Ranveer Singh", accent: ["#f46b45", "#eea849"] },
      { id: "ajay", name: "Ajay Devgn", accent: ["#134e5e", "#71b280"] },
      { id: "akshay", name: "Akshay Kumar", accent: ["#3a1c71", "#d76d77"] },
      { id: "amitabh", name: "Amitabh Bachchan", accent: ["#42275a", "#734b6d"] },
      { id: "saif", name: "Saif Ali Khan", accent: ["#0f2027", "#2c5364"] },
      { id: "deepika", name: "Deepika Padukone", accent: ["#355c7d", "#6c5b7b"] },
      { id: "priyanka", name: "Priyanka Chopra", accent: ["#614385", "#516395"] },
      { id: "alia", name: "Alia Bhatt", accent: ["#ff758c", "#ff7eb3"] },
      { id: "kareena", name: "Kareena Kapoor", accent: ["#cc2b5e", "#753a88"] },
      { id: "katrina", name: "Katrina Kaif", accent: ["#7f00ff", "#e100ff"] },
      { id: "anushka", name: "Anushka Sharma", accent: ["#11998e", "#0575e6"] },
      { id: "madhuri", name: "Madhuri Dixit", accent: ["#ff512f", "#dd2476"] },
      { id: "kajol", name: "Kajol", accent: ["#8360c3", "#2ebf91"] },
      { id: "vidya", name: "Vidya Balan", accent: ["#41295a", "#2f0743"] },
      { id: "kiara", name: "Kiara Advani", accent: ["#4776e6", "#8e54e9"] }
    ]
  }
};

const MESSAGE_TYPES = {
  MODE_INIT: "mode_init",
  TILE_TOGGLE: "tile_toggle",
  COUNT_UPDATE: "count_update",
  SYNC: "sync",
  RESET: "reset"
};

const dom = {
  modeSelect: document.getElementById("modeSelect"),
  createOfferBtn: document.getElementById("createOfferBtn"),
  copySignalBtn: document.getElementById("copySignalBtn"),
  createAnswerBtn: document.getElementById("createAnswerBtn"),
  acceptAnswerBtn: document.getElementById("acceptAnswerBtn"),
  undoBtn: document.getElementById("undoBtn"),
  resyncBtn: document.getElementById("resyncBtn"),
  resetBtn: document.getElementById("resetBtn"),
  localSignalOutput: document.getElementById("localSignalOutput"),
  remoteSignalInput: document.getElementById("remoteSignalInput"),
  statusText: document.getElementById("statusText"),
  connectionPill: document.getElementById("connectionPill"),
  yourRemainingCount: document.getElementById("yourRemainingCount"),
  opponentRemainingCount: document.getElementById("opponentRemainingCount"),
  opponentScoreCard: document.getElementById("opponentScoreCard"),
  yourBoardContainer: document.getElementById("yourBoardContainer"),
  opponentBoardContainer: document.getElementById("opponentBoardContainer"),
  boardInfo: document.getElementById("boardInfo")
};

const state = {
  modeId: "bollywood",
  shuffleSeed: null,
  board: [],
  yourEliminated: new Set(),
  opponentEliminated: new Set(),
  history: [],
  secretIndex: null,
  yourRemaining: GAME_MODES.bollywood.characters.length,
  opponentRemaining: GAME_MODES.bollywood.characters.length,
  connectionStatus: "idle",
  peerConnection: null,
  dataChannel: null,
  isHost: false,
  opponentCountFlashTimer: null,
  statusMessage: "Create an offer or paste a remote offer to begin."
};

function createSeed() {
  const bytes = new Uint32Array(2);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(36)).join("-");
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let value = hashSeed(seed) || 1;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seed) {
  const copy = items.slice();
  const random = createRng(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

function setStatus(message, type = "info") {
  state.statusMessage = message;
  dom.statusText.textContent = message;
  dom.statusText.style.color = type === "error" ? "#ffd4db" : "";
}

function updateConnectionStatus(status, label) {
  state.connectionStatus = status;
  dom.connectionPill.dataset.status = status;
  dom.connectionPill.textContent = label;
}

function getCurrentMode() {
  return GAME_MODES[state.modeId];
}

function getCharacterCount() {
  return getCurrentMode().characters.length;
}

function getLocalPhotoPath(character) {
  return `./assets/photos/${character.id}.jpg`;
}

function resetLocalStateForBoard() {
  state.yourEliminated = new Set();
  state.opponentEliminated = new Set();
  state.history = [];
  state.secretIndex = null;
  state.yourRemaining = getCharacterCount();
  state.opponentRemaining = getCharacterCount();
}

function initializeBoard(modeId, seed) {
  const mode = GAME_MODES[modeId];
  if (!mode) {
    throw new Error("Unknown mode selected.");
  }

  state.modeId = modeId;
  dom.modeSelect.value = modeId;
  state.shuffleSeed = seed;
  state.board = seededShuffle(mode.characters, seed).map((character) => ({
    ...character,
    initials: getInitials(character.name),
    photoUrl: getLocalPhotoPath(character)
  }));

  resetLocalStateForBoard();
  renderCounts();
  renderBoards();
  renderBoardInfo();
}

function renderBoardInfo() {
  if (!state.board.length) {
    dom.boardInfo.textContent = "Waiting for a round to start.";
    return;
  }
  dom.boardInfo.textContent = `${getCurrentMode().label} • Seed ${state.shuffleSeed}`;
}

function renderCounts() {
  dom.yourRemainingCount.textContent = String(state.yourRemaining);
  dom.opponentRemainingCount.textContent = String(state.opponentRemaining);
}

function flashOpponentCount() {
  dom.opponentScoreCard.classList.remove("highlight");
  void dom.opponentScoreCard.offsetWidth;
  dom.opponentScoreCard.classList.add("highlight");
  window.clearTimeout(state.opponentCountFlashTimer);
  state.opponentCountFlashTimer = window.setTimeout(() => {
    dom.opponentScoreCard.classList.remove("highlight");
  }, 950);
}

function createAvatar(character) {
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.style.background = `linear-gradient(135deg, ${character.accent[0]}, ${character.accent[1]})`;

  const fallback = document.createElement("span");
  fallback.className = "avatar-fallback";
  fallback.textContent = character.initials;
  avatar.appendChild(fallback);

  if (character.photoUrl) {
    avatar.classList.add("has-photo");
    const image = document.createElement("img");
    image.src = character.photoUrl;
    image.alt = `${character.name} photo`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      avatar.classList.remove("has-photo");
      image.remove();
    });
    avatar.appendChild(image);
  }

  return avatar;
}

function renderYourBoard() {
  if (!state.board.length) {
    dom.yourBoardContainer.innerHTML = '<div class="empty-state">Create or join a round to generate the shuffled local board.</div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "board-grid";

  state.board.forEach((character, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    if (state.yourEliminated.has(index)) {
      card.classList.add("is-eliminated");
    }
    card.setAttribute("aria-pressed", String(state.yourEliminated.has(index)));

    const topline = document.createElement("div");
    topline.className = "tile-topline";

    const tileIndex = document.createElement("span");
    tileIndex.className = "tile-index";
    tileIndex.textContent = `Slot ${index + 1}`;

    const secretToggle = document.createElement("button");
    secretToggle.type = "button";
    secretToggle.className = "secret-toggle";
    secretToggle.textContent = state.secretIndex === index ? "Secret" : "Mark Secret";
    if (state.secretIndex === index) {
      secretToggle.classList.add("active");
    }
    secretToggle.disabled = state.yourEliminated.has(index);
    secretToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSecret(index);
    });

    topline.append(tileIndex, secretToggle);

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = character.name;

    const subtext = document.createElement("div");
    subtext.className = "card-subtext";
    subtext.textContent = state.yourEliminated.has(index) ? "Eliminated from your board" : "Active on your board";

    meta.append(name, subtext);
    card.append(topline, createAvatar(character), meta);

    if (state.secretIndex === index) {
      const badge = document.createElement("div");
      badge.className = "secret-badge";
      badge.textContent = "Your Secret";
      card.appendChild(badge);
    }

    card.addEventListener("click", () => toggleLocalTile(index));
    grid.appendChild(card);
  });

  dom.yourBoardContainer.innerHTML = "";
  dom.yourBoardContainer.appendChild(grid);
}

function renderOpponentBoard() {
  if (!state.board.length) {
    dom.opponentBoardContainer.innerHTML = '<div class="empty-state">Opponent tile positions will appear here after the round is initialized.</div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "mini-grid";

  state.board.forEach((_, index) => {
    const tile = document.createElement("div");
    tile.className = "mini-tile";
    if (state.opponentEliminated.has(index)) {
      tile.classList.add("is-eliminated");
    }

    const idx = document.createElement("span");
    idx.className = "mini-index";
    idx.textContent = String(index + 1);

    const front = document.createElement("div");
    front.className = "mini-face";
    front.textContent = "?";

    const back = document.createElement("div");
    back.className = "mini-back";
    back.textContent = "Flipped";

    tile.append(idx, front, back);
    grid.appendChild(tile);
  });

  dom.opponentBoardContainer.innerHTML = "";
  dom.opponentBoardContainer.appendChild(grid);
}

function renderBoards() {
  renderYourBoard();
  renderOpponentBoard();
  renderActionButtons();
}

function renderActionButtons() {
  dom.undoBtn.disabled = state.history.length === 0 || !state.board.length;
  dom.resyncBtn.disabled = !state.board.length;
  dom.resetBtn.disabled = !state.board.length;
}

function getRemainingCount(eliminatedSet) {
  return getCharacterCount() - eliminatedSet.size;
}

function isChannelOpen() {
  return Boolean(state.dataChannel && state.dataChannel.readyState === "open");
}

function sendMessage(message) {
  if (!isChannelOpen()) {
    return false;
  }
  state.dataChannel.send(JSON.stringify(message));
  return true;
}

function sendCountUpdate() {
  sendMessage({ type: MESSAGE_TYPES.COUNT_UPDATE, remaining: state.yourRemaining });
}

function sendTileToggle(index, eliminated) {
  sendMessage({ type: MESSAGE_TYPES.TILE_TOGGLE, index, eliminated });
}

function sendSync() {
  if (!state.board.length) {
    return;
  }

  sendMessage({
    type: MESSAGE_TYPES.SYNC,
    remaining: state.yourRemaining,
    eliminated: Array.from(state.yourEliminated).sort((a, b) => a - b)
  });
  setStatus("Resync snapshot sent.");
}

function sendModeInit() {
  if (!state.board.length) {
    return;
  }

  sendMessage({
    type: MESSAGE_TYPES.MODE_INIT,
    mode: state.modeId,
    shuffleSeed: state.shuffleSeed
  });
}

function sendReset(seed) {
  sendMessage({
    type: MESSAGE_TYPES.RESET,
    mode: state.modeId,
    shuffleSeed: seed
  });
}

function toggleSecret(index) {
  if (state.yourEliminated.has(index)) {
    return;
  }
  state.secretIndex = state.secretIndex === index ? null : index;
  renderYourBoard();
}

function toggleLocalTile(index) {
  if (!state.board.length || index < 0 || index >= state.board.length) {
    return;
  }

  const eliminated = !state.yourEliminated.has(index);
  if (eliminated) {
    state.yourEliminated.add(index);
    if (state.secretIndex === index) {
      state.secretIndex = null;
    }
  } else {
    state.yourEliminated.delete(index);
  }

  state.history.push({ index, eliminated });
  state.yourRemaining = getRemainingCount(state.yourEliminated);
  renderCounts();
  renderBoards();

  if (isChannelOpen()) {
    sendTileToggle(index, eliminated);
    sendCountUpdate();
  }
}

function undoLastMove() {
  const lastMove = state.history.pop();
  if (!lastMove) {
    return;
  }

  if (lastMove.eliminated) {
    state.yourEliminated.delete(lastMove.index);
  } else {
    state.yourEliminated.add(lastMove.index);
  }

  state.yourRemaining = getRemainingCount(state.yourEliminated);
  renderCounts();
  renderBoards();

  if (isChannelOpen()) {
    sendTileToggle(lastMove.index, !lastMove.eliminated);
    sendCountUpdate();
  }

  setStatus("Last local elimination was undone.");
}

function startFreshRound(seed, source) {
  initializeBoard(state.modeId, seed);
  setStatus(source === "remote" ? "Remote round reset received. New shuffled board loaded." : "Fresh round started with a new shuffle.");
}

function handleResetRequest() {
  if (!state.board.length) {
    return;
  }

  const seed = createSeed();
  startFreshRound(seed, "local");
  if (isChannelOpen()) {
    sendReset(seed);
    sendSync();
  }
}

function validateRemoteMessage(message) {
  if (!message || typeof message !== "object") {
    return false;
  }

  if (!Object.values(MESSAGE_TYPES).includes(message.type)) {
    return false;
  }

  const count = getCharacterCount();
  if (message.type === MESSAGE_TYPES.MODE_INIT || message.type === MESSAGE_TYPES.RESET) {
    return typeof message.mode === "string" && Boolean(GAME_MODES[message.mode]) && typeof message.shuffleSeed === "string";
  }

  if (message.type === MESSAGE_TYPES.TILE_TOGGLE) {
    return Number.isInteger(message.index) && message.index >= 0 && message.index < count && typeof message.eliminated === "boolean";
  }

  if (message.type === MESSAGE_TYPES.COUNT_UPDATE) {
    return Number.isInteger(message.remaining) && message.remaining >= 0 && message.remaining <= count;
  }

  if (message.type === MESSAGE_TYPES.SYNC) {
    return Number.isInteger(message.remaining)
      && message.remaining >= 0
      && message.remaining <= count
      && Array.isArray(message.eliminated)
      && message.eliminated.every((index) => Number.isInteger(index) && index >= 0 && index < count);
  }

  return true;
}

function applyOpponentCount(remaining) {
  state.opponentRemaining = remaining;
  renderCounts();
  flashOpponentCount();
}

function handleRemoteMessage(event) {
  const parsed = safeJsonParse(event.data);
  if (!parsed.ok || !validateRemoteMessage(parsed.value)) {
    setStatus("Ignored malformed remote game message.", "error");
    return;
  }

  const message = parsed.value;
  switch (message.type) {
    case MESSAGE_TYPES.MODE_INIT:
      initializeBoard(message.mode, message.shuffleSeed);
      setStatus(`Connected round ready. ${GAME_MODES[message.mode].label} board loaded.`);
      if (isChannelOpen()) {
        sendSync();
      }
      break;
    case MESSAGE_TYPES.TILE_TOGGLE:
      if (message.eliminated) {
        state.opponentEliminated.add(message.index);
      } else {
        state.opponentEliminated.delete(message.index);
      }
      renderOpponentBoard();
      break;
    case MESSAGE_TYPES.COUNT_UPDATE:
      applyOpponentCount(message.remaining);
      break;
    case MESSAGE_TYPES.SYNC:
      state.opponentEliminated = new Set(message.eliminated);
      applyOpponentCount(message.remaining);
      renderOpponentBoard();
      setStatus("Remote board resynced.");
      break;
    case MESSAGE_TYPES.RESET:
      state.modeId = message.mode;
      startFreshRound(message.shuffleSeed, "remote");
      break;
    default:
      break;
  }
}

function closePeerConnection() {
  if (state.dataChannel) {
    state.dataChannel.onopen = null;
    state.dataChannel.onclose = null;
    state.dataChannel.onerror = null;
    state.dataChannel.onmessage = null;
    try {
      state.dataChannel.close();
    } catch (error) {
      // Ignore close errors for torn-down channels.
    }
  }

  if (state.peerConnection) {
    state.peerConnection.ondatachannel = null;
    state.peerConnection.onconnectionstatechange = null;
    state.peerConnection.oniceconnectionstatechange = null;
    try {
      state.peerConnection.close();
    } catch (error) {
      // Ignore close errors for torn-down peer connections.
    }
  }

  state.peerConnection = null;
  state.dataChannel = null;
}

function attachDataChannel(channel) {
  state.dataChannel = channel;

  channel.onopen = () => {
    updateConnectionStatus("connected", "Connected");
    setStatus("Peer connection open. Board updates will sync live.");
    if (state.isHost && state.board.length) {
      sendModeInit();
      sendSync();
    } else if (state.board.length) {
      sendSync();
    }
  };

  channel.onclose = () => {
    updateConnectionStatus("disconnected", "Disconnected");
    setStatus("Data channel closed. Reconnect by exchanging a new offer/answer.", "error");
  };

  channel.onerror = () => {
    updateConnectionStatus("error", "Connection error");
    setStatus("A data channel error occurred.", "error");
  };

  channel.onmessage = handleRemoteMessage;
}

function createPeerConnection() {
  closePeerConnection();

  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  });

  peerConnection.ondatachannel = (event) => {
    attachDataChannel(event.channel);
  };

  peerConnection.onconnectionstatechange = () => {
    const currentState = peerConnection.connectionState;
    if (currentState === "connected") {
      updateConnectionStatus("connected", "Connected");
    } else if (currentState === "connecting") {
      updateConnectionStatus("connecting", "Connecting");
    } else if (currentState === "failed") {
      updateConnectionStatus("error", "Connection failed");
      setStatus("WebRTC connection failed. Create a fresh offer and answer.", "error");
    } else if (currentState === "disconnected") {
      updateConnectionStatus("disconnected", "Disconnected");
    } else if (currentState === "closed") {
      updateConnectionStatus("disconnected", "Closed");
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection.iceConnectionState === "failed") {
      updateConnectionStatus("error", "ICE failed");
    }
  };

  state.peerConnection = peerConnection;
  return peerConnection;
}

function waitForIceGatheringComplete(peerConnection) {
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve();
      }
    }

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

async function createOfferFlow() {
  try {
    state.isHost = true;
    state.modeId = dom.modeSelect.value;
    initializeBoard(state.modeId, createSeed());
    updateConnectionStatus("connecting", "Creating offer");
    setStatus("Creating peer offer. Wait for the signal text to appear.");

    const peerConnection = createPeerConnection();
    const channel = peerConnection.createDataChannel("whos-left");
    attachDataChannel(channel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await waitForIceGatheringComplete(peerConnection);

    dom.localSignalOutput.value = JSON.stringify(peerConnection.localDescription);
    setStatus("Offer ready. Send the text to the other player, then paste their answer and click Accept Answer.");
  } catch (error) {
    console.error(error);
    updateConnectionStatus("error", "Offer failed");
    setStatus("Failed to create an offer.", "error");
  }
}

async function createAnswerFlow() {
  const remoteText = dom.remoteSignalInput.value.trim();
  if (!remoteText) {
    setStatus("Paste a remote offer first.", "error");
    return;
  }

  const parsed = safeJsonParse(remoteText);
  if (!parsed.ok || parsed.value.type !== "offer") {
    setStatus("The remote signal is not a valid offer JSON object.", "error");
    return;
  }

  try {
    state.isHost = false;
    updateConnectionStatus("connecting", "Creating answer");
    setStatus("Creating answer from the pasted offer.");

    const peerConnection = createPeerConnection();
    await peerConnection.setRemoteDescription(parsed.value);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    await waitForIceGatheringComplete(peerConnection);

    dom.localSignalOutput.value = JSON.stringify(peerConnection.localDescription);
    setStatus("Answer ready. Send it back to the host. The board will load when the host finishes connecting.");
  } catch (error) {
    console.error(error);
    updateConnectionStatus("error", "Answer failed");
    setStatus("Failed to create an answer from the pasted offer.", "error");
  }
}

async function acceptAnswerFlow() {
  const remoteText = dom.remoteSignalInput.value.trim();
  if (!remoteText) {
    setStatus("Paste a remote answer first.", "error");
    return;
  }

  const parsed = safeJsonParse(remoteText);
  if (!parsed.ok || parsed.value.type !== "answer") {
    setStatus("The remote signal is not a valid answer JSON object.", "error");
    return;
  }

  if (!state.peerConnection) {
    setStatus("Create an offer first before accepting an answer.", "error");
    return;
  }

  try {
    await state.peerConnection.setRemoteDescription(parsed.value);
    setStatus("Answer accepted. Waiting for the data channel to open.");
    updateConnectionStatus("connecting", "Finishing connection");
  } catch (error) {
    console.error(error);
    updateConnectionStatus("error", "Accept failed");
    setStatus("Failed to accept the pasted answer.", "error");
  }
}

async function copyLocalSignal() {
  const text = dom.localSignalOutput.value.trim();
  if (!text) {
    setStatus("There is no local signal to copy yet.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Signal copied to the clipboard.");
  } catch (error) {
    dom.localSignalOutput.focus();
    dom.localSignalOutput.select();
    setStatus("Clipboard copy failed. The signal text is selected so you can copy it manually.", "error");
  }
}

function handleModeSelection(event) {
  state.modeId = event.target.value;
  if (!state.board.length || isChannelOpen()) {
    return;
  }
  renderBoardInfo();
}

function bootstrap() {
  renderCounts();
  renderBoards();
  renderBoardInfo();
  setStatus(state.statusMessage);
  updateConnectionStatus("idle", "Not connected");

  dom.createOfferBtn.addEventListener("click", createOfferFlow);
  dom.copySignalBtn.addEventListener("click", copyLocalSignal);
  dom.createAnswerBtn.addEventListener("click", createAnswerFlow);
  dom.acceptAnswerBtn.addEventListener("click", acceptAnswerFlow);
  dom.undoBtn.addEventListener("click", undoLastMove);
  dom.resyncBtn.addEventListener("click", sendSync);
  dom.resetBtn.addEventListener("click", handleResetRequest);
  dom.modeSelect.addEventListener("change", handleModeSelection);
}

bootstrap();
