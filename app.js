const state = {
  modeId: "bollywood",
  shuffleSeed: null,
  board: [],
  yourEliminated: new Set(),
  opponentEliminated: new Set(),
  history: [],
  secretIndex: null,
  yourRemaining: 0,
  opponentRemaining: 0,
  connectionStatus: "idle",
  peerConnection: null,
  dataChannel: null,
  isHost: false,
  opponentCountFlashTimer: null,
  statusMessage: "Create an offer or paste a remote offer to begin.",
  roundLocked: false,
  roundResult: null,
  turnPhase: "setup",
  turnOwner: "host",
  turnCounter: 0,
  eliminatedTurn: new Map(),
  mySlotShuffle: [],
  opponentSlotShuffle: []
};

const CONFETTI_COLORS = ["#7c9cff", "#8d7dff", "#30d09b", "#ffcc66", "#ff7183", "#ffffff"];

function setStatus(message, type) {
  type = type || "info";
  state.statusMessage = message;
  dom.statusText.textContent = message;
  dom.statusText.style.color = type === "error" ? "#ffd4db" : "";
}

function updateConnectionStatus(status, label) {
  state.connectionStatus = status;
  dom.connectionPill.dataset.status = status;
  dom.connectionPill.textContent = label;
}

function collapseConnectionPanel() {
  dom.connectionPanel.setAttribute("collapsed", "");
  dom.connectionPanelToggle.setAttribute("aria-expanded", "false");
}

function expandConnectionPanel() {
  dom.connectionPanel.removeAttribute("collapsed");
  dom.connectionPanelToggle.setAttribute("aria-expanded", "true");
}

function toggleConnectionPanel() {
  if (dom.connectionPanel.hasAttribute("collapsed")) {
    expandConnectionPanel();
  } else {
    collapseConnectionPanel();
  }
}

function getTurnRole() {
  const isCurrentOwner = state.isHost === (state.turnOwner === "host");
  if (state.turnPhase === "setup") {
    return isCurrentOwner ? "pick" : "wait";
  }
  return isCurrentOwner ? "question" : "answer";
}

function areBoardActionsEnabled() {
  return !state.roundLocked && state.turnPhase === "play" && getTurnRole() === "question";
}

function canChooseSecret() {
  return !state.roundLocked && state.turnPhase === "setup" && getTurnRole() === "pick";
}

function resetLocalStateForBoard() {
  state.yourEliminated = new Set();
  state.opponentEliminated = new Set();
  state.history = [];
  state.secretIndex = null;
  state.yourRemaining = getCharacterCountForMode(state.modeId);
  state.opponentRemaining = getCharacterCountForMode(state.modeId);
  state.roundLocked = false;
  state.roundResult = null;
  state.turnPhase = "setup";
  state.turnOwner = "host";
  state.turnCounter = 0;
  state.eliminatedTurn = new Map();
}

function clearConfetti() {
  dom.confettiField.innerHTML = "";
}

function launchConfetti() {
  clearConfetti();
  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = (Math.random() * 100) + "%";
    piece.style.background = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
    piece.style.animationDuration = (3 + Math.random() * 1.4) + "s";
    piece.style.animationDelay = (Math.random() * 0.35) + "s";
    piece.style.setProperty("--drift", ((Math.random() - 0.5) * 180) + "px");
    dom.confettiField.appendChild(piece);
  }
}

function renderRoundResultOverlay() {
  if (state.roundResult !== "win" && state.roundResult !== "lose") {
    dom.roundResultOverlay.hidden = true;
    dom.roundResultCard.dataset.result = "";
    dom.roundResultEmoji.textContent = "";
    dom.roundResultTitle.textContent = "";
    dom.roundResultBody.textContent = "";
    clearConfetti();
    return;
  }

  dom.roundResultOverlay.hidden = false;
  dom.roundResultCard.dataset.result = state.roundResult;

  if (state.roundResult === "win") {
    dom.roundResultEmoji.textContent = "🎉";
    dom.roundResultTitle.textContent = "You Win";
    dom.roundResultBody.textContent = "Your guess was correct. The round is locked until someone presses Reset.";
    dom.newGameBtn.hidden = !state.isHost;
    launchConfetti();
    return;
  }

  dom.roundResultEmoji.textContent = "😵";
  dom.roundResultTitle.textContent = "You Lose";
  dom.roundResultBody.textContent = "Your secret was guessed correctly. The round is locked until someone presses Reset.";
  dom.newGameBtn.hidden = !state.isHost;
  clearConfetti();
}

function initializeBoard(modeId, seed) {
  const mode = getModeById(modeId);
  if (!mode) {
    throw new Error("Mode not found: " + modeId);
  }

  state.modeId = modeId;
  dom.modeSelect.value = modeId;
  state.shuffleSeed = seed;
  
  var pool = seededSample(mode.characters, 25, seed);
  var modeExtensions = mode.extensions || [".webp", ".png", ".jpg", ".jpeg"];
  state.board = seededShuffle(pool, seed).map(function(character) {
    return {
      id: character.id,
      name: character.name,
      accent: character.accent,
      initials: getInitials(character.name),
      photoUrl: getLocalPhotoPath(character, modeId),
      extensions: modeExtensions
    };
  });

  state.mySlotShuffle = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], seed + "hostslot");
  state.opponentSlotShuffle = seededShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], seed + "joinerslot");

  resetLocalStateForBoard();
  renderCounts();
  renderBoards();
  renderBoardInfo();
}

function getCurrentMode() {
  return getModeById(state.modeId);
}

function renderBoardInfo() {
  if (!state.board.length) {
    dom.boardInfo.textContent = "Waiting for a round to start.";
    return;
  }
  dom.boardInfo.textContent = getCurrentMode().label + " • Seed " + state.shuffleSeed;
}

function renderCounts() {
  dom.yourRemainingCount.textContent = String(state.yourRemaining);
  dom.opponentRemainingCount.textContent = String(state.opponentRemaining);
}

function renderTurnStatus() {
  const role = !state.board.length ? "waiting" : getTurnRole();
  dom.turnStatusCard.dataset.turn = role;
  if (role === "question") {
    dom.turnStatusValue.textContent = "Asking";
  } else if (role === "answer") {
    dom.turnStatusValue.textContent = "Answering";
  } else if (role === "pick") {
    dom.turnStatusValue.textContent = "Pick Secret";
  } else if (role === "wait") {
    dom.turnStatusValue.textContent = "Waiting";
  } else {
    dom.turnStatusValue.textContent = "Waiting";
  }
}

function flashOpponentCount() {
  dom.opponentScoreCard.classList.remove("highlight");
  void dom.opponentScoreCard.offsetWidth;
  dom.opponentScoreCard.classList.add("highlight");
  clearTimeout(state.opponentCountFlashTimer);
  state.opponentCountFlashTimer = setTimeout(function() {
    dom.opponentScoreCard.classList.remove("highlight");
  }, 950);
}

function createAvatar(character) {
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.style.background = "linear-gradient(135deg, " + character.accent[0] + ", " + character.accent[1] + ")";

  const fallback = document.createElement("span");
  fallback.className = "avatar-fallback";
  fallback.textContent = character.initials;
  avatar.appendChild(fallback);

if (character.photoUrl) {
    avatar.classList.add("has-photo");
    var charExtensions = character.extensions || [".webp", ".png", ".jpg", ".jpeg"];
    var extIndex = 0;

    function tryLoadImage() {
      if (extIndex >= charExtensions.length) {
        avatar.classList.remove("has-photo");
        return;
      }
      var image = document.createElement("img");
      image.src = character.photoUrl + charExtensions[extIndex];
      image.alt = character.name + " photo";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", function() {
        image.remove();
        extIndex++;
        tryLoadImage();
      });
      avatar.appendChild(image);
    }

    tryLoadImage();
  }

  return avatar;
}

function renderYourBoard() {
  if (!state.board.length) {
    dom.yourBoardContainer.innerHTML = '<div class="empty-state">Create or join a round to generate the shuffled local board.</div>';
    return;
  }

  if (state.turnPhase === "setup" && getTurnRole() === "wait") {
    dom.yourBoardContainer.innerHTML = '<div class="empty-state turn-blocked-state"><strong>Waiting for the other player to choose a secret.</strong><span>Your setup turn will come next. Once both secrets are selected, the normal question and answer flow begins.</span></div>';
    return;
  }

  if (state.turnPhase === "play" && getTurnRole() === "answer" && state.secretIndex !== null) {
    dom.yourBoardContainer.innerHTML = '<div class="empty-state turn-blocked-state"><strong>You are answering right now.</strong><span>Your full board is hidden while the other player asks questions. Keep watching the opponent mini-board to see what they flipped after your answers.</span></div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "board-grid";
  const boardActionsEnabled = areBoardActionsEnabled();
  const canGuess = isChannelOpen() && boardActionsEnabled;

  for (let displayIndex = 0; displayIndex < 25; displayIndex++) {
    const actualIndex = state.mySlotShuffle[displayIndex];
    const character = state.board[actualIndex];
    
    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    if (state.yourEliminated.has(actualIndex)) {
      card.classList.add("is-eliminated");
    }
    card.setAttribute("aria-pressed", String(state.yourEliminated.has(actualIndex)));

    const topline = document.createElement("div");
    topline.className = "tile-topline";

    const tileIndex = document.createElement("span");
    tileIndex.className = "tile-index";
    tileIndex.textContent = "Slot " + (displayIndex + 1);

    const secretToggle = document.createElement("button");
    secretToggle.type = "button";
    secretToggle.className = "secret-toggle";
    secretToggle.textContent = state.secretIndex === actualIndex ? "Secret" : "Mark Secret";
    if (state.secretIndex === actualIndex) {
      secretToggle.classList.add("active");
    }
    secretToggle.disabled = !canChooseSecret();
    secretToggle.addEventListener("click", function(event) {
      event.stopPropagation();
      toggleSecret(actualIndex);
    });

    topline.appendChild(tileIndex);
    topline.appendChild(secretToggle);

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = character.name;

    const subtext = document.createElement("div");
    subtext.className = "card-subtext";
    subtext.textContent = state.yourEliminated.has(actualIndex) ? "Eliminated from your board" : "Active on your board";

    meta.appendChild(name);
    meta.appendChild(subtext);
    card.appendChild(topline);
    card.appendChild(createAvatar(character));
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const guessButton = document.createElement("button");
    guessButton.type = "button";
    guessButton.className = "secondary-btn card-action-btn";
    guessButton.textContent = "Guess";
    guessButton.disabled = !canGuess;
    guessButton.addEventListener("click", function(event) {
      event.stopPropagation();
      makeGuess(actualIndex);
    });

    actions.appendChild(guessButton);
    card.appendChild(actions);

    if (state.secretIndex === actualIndex) {
      const badge = document.createElement("div");
      badge.className = "secret-badge";
      badge.textContent = "Your Secret";
      card.appendChild(badge);
    }

    card.addEventListener("click", function() { toggleLocalTile(actualIndex); });
    grid.appendChild(card);
  }

  dom.yourBoardContainer.innerHTML = "";
  dom.yourBoardContainer.appendChild(grid);
}

function renderSecretPanel() {
  if (!state.board.length) {
    dom.secretPanelContainer.innerHTML = '<div class="secret-panel-empty">Start or join a round to choose your private secret.</div>';
    return;
  }

  if (state.secretIndex === null) {
    dom.secretPanelContainer.innerHTML = '<div class="secret-panel-empty">No secret selected yet. Use Mark Secret on any card.</div>';
    return;
  }

  const character = state.board[state.secretIndex];
  const wrapper = document.createElement("div");
  wrapper.className = "secret-panel-card";

  const meta = document.createElement("div");
  meta.className = "secret-panel-meta";

  const name = document.createElement("div");
  name.className = "secret-panel-name";
  name.textContent = character.name;

  const slot = document.createElement("div");
  slot.className = "secret-panel-slot";
  slot.textContent = "Slot " + (state.secretIndex + 1);

  const stateText = document.createElement("div");
  stateText.className = "secret-panel-state";
  if (state.yourEliminated.has(state.secretIndex)) {
    stateText.classList.add("is-eliminated");
    stateText.textContent = "Eliminated on your board";
  } else {
    stateText.textContent = "Still active on your board";
  }

  meta.appendChild(name);
  meta.appendChild(slot);
  meta.appendChild(stateText);
  wrapper.appendChild(createAvatar(character));
  wrapper.appendChild(meta);

  dom.secretPanelContainer.innerHTML = "";
  dom.secretPanelContainer.appendChild(wrapper);
}

function renderOpponentBoard() {
  if (!state.board.length) {
    dom.opponentBoardContainer.innerHTML = '<div class="empty-state">Opponent tile positions will appear here after the round is initialized.</div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "mini-grid";

  for (let displayIndex = 0; displayIndex < 25; displayIndex++) {
    const actualSlot = state.opponentSlotShuffle[displayIndex];
    const tile = document.createElement("div");
    tile.className = "mini-tile";
    if (state.opponentEliminated.has(actualSlot)) {
      tile.classList.add("is-eliminated");
    }

    const idx = document.createElement("span");
    idx.className = "mini-index";
    idx.textContent = String(displayIndex + 1);

    const front = document.createElement("div");
    front.className = "mini-face";
    front.textContent = "?";

    const back = document.createElement("div");
    back.className = "mini-back";
    back.textContent = "Flipped";

    tile.appendChild(idx);
    tile.appendChild(front);
    tile.appendChild(back);
    grid.appendChild(tile);
  }

  dom.opponentBoardContainer.innerHTML = "";
  dom.opponentBoardContainer.appendChild(grid);
}

function renderBoards() {
  renderYourBoard();
  renderOpponentBoard();
  renderSecretPanel();
  renderTurnStatus();
  renderActionButtons();
  renderRoundResultOverlay();
}

function renderActionButtons() {
  dom.undoBtn.disabled = state.history.length === 0 || !state.board.length || !areBoardActionsEnabled();
  dom.resyncBtn.disabled = !state.board.length || state.roundLocked;
  dom.passControlBtn.disabled = !state.board.length || !isChannelOpen() || state.roundLocked || !((state.turnPhase === "setup" && getTurnRole() === "pick" && state.secretIndex !== null) || (state.turnPhase === "play" && getTurnRole() === "question"));
  dom.resetBtn.disabled = !state.board.length;
}

function getRemainingCount(eliminatedSet) {
  return getCharacterCountForMode(state.modeId) - eliminatedSet.size;
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
  sendMessage({ type: MESSAGE_TYPES.TILE_TOGGLE, index: index, eliminated: eliminated });
}

function sendSync() {
  if (!state.board.length) { return; }

  sendMessage({
    type: MESSAGE_TYPES.SYNC,
    remaining: state.yourRemaining,
    eliminated: Array.from(state.yourEliminated).sort(function(a, b) { return a - b; }),
    turnPhase: state.turnPhase,
    turnOwner: state.turnOwner,
    slotShuffle: state.opponentSlotShuffle
  });
  setStatus("Resync snapshot sent.");
}

function sendModeInit() {
  if (!state.board.length) { return; }

  sendMessage({
    type: MESSAGE_TYPES.MODE_INIT,
    mode: state.modeId,
    shuffleSeed: state.shuffleSeed,
    mySlotShuffle: state.mySlotShuffle,
    opponentSlotShuffle: state.opponentSlotShuffle
  });
}

function sendReset(seed) {
  sendMessage({
    type: MESSAGE_TYPES.RESET,
    mode: state.modeId,
    shuffleSeed: seed
  });
}

function sendTurnUpdate() {
  sendMessage({ type: MESSAGE_TYPES.TURN_UPDATE, turnPhase: state.turnPhase, turnOwner: state.turnOwner });
}

function sendGuessRequest(index) {
  sendMessage({ type: MESSAGE_TYPES.GUESS_REQUEST, index: index });
}

function sendGuessResult(index, correct) {
  sendMessage({ type: MESSAGE_TYPES.GUESS_RESULT, index: index, correct: correct });
}

function toggleSecret(index) {
  if (!canChooseSecret()) { return; }
  state.secretIndex = state.secretIndex === index ? null : index;
  renderBoards();
}

function toggleLocalTile(index) {
  if (!state.board.length || index < 0 || index >= state.board.length || !areBoardActionsEnabled()) { return; }

  const currentlyEliminated = state.yourEliminated.has(index);
  
  if (currentlyEliminated) {
    const eliminatedTurn = state.eliminatedTurn.get(index);
    if (eliminatedTurn !== state.turnCounter) {
      setStatus("Cannot un-eliminate characters from previous turns.", "error");
      return;
    }
    state.yourEliminated.delete(index);
    state.eliminatedTurn.delete(index);
  } else {
    state.yourEliminated.add(index);
    state.eliminatedTurn.set(index, state.turnCounter);
  }

  state.history.push({ index: index, eliminated: !currentlyEliminated, turnOwner: state.turnOwner });
  state.yourRemaining = getRemainingCount(state.yourEliminated);
  renderCounts();
  renderBoards();

  if (isChannelOpen()) {
    sendTileToggle(index, !currentlyEliminated);
    sendCountUpdate();
  }
}

function lockRound(message) {
  state.roundLocked = true;
  setStatus(message);
  setTimeout(function() { renderBoards(); }, 0);
}

function lockRoundWithResult(result, message) {
  state.roundResult = result;
  state.roundLocked = true;
  setStatus(message);
  setTimeout(function() { renderBoards(); }, 0);
}

function applyWrongGuessElimination(index) {
  if (state.yourEliminated.has(index)) { return; }

  state.yourEliminated.add(index);
  state.yourRemaining = getRemainingCount(state.yourEliminated);
  renderCounts();
  renderBoards();

  if (isChannelOpen()) {
    sendTileToggle(index, true);
    sendCountUpdate();
  }
}

function makeGuess(index) {
  if (!state.board.length || index < 0 || index >= state.board.length) { return; }
  if (!isChannelOpen()) { setStatus("Connect to another player before making a guess.", "error"); return; }
  if (state.turnPhase !== "play") { setStatus("Finish the secret selection turns before making a guess.", "error"); return; }
  if (!areBoardActionsEnabled()) { setStatus(getTurnRole() === "answer" ? "Only the current questioner can guess." : "The round is locked. Reset to start a new one.", "error"); return; }

  sendGuessRequest(index);
  setStatus("Guess sent for " + state.board[index].name + ". Waiting for the other player to confirm.");
}

function undoLastMove() {
  if (!areBoardActionsEnabled()) { return; }

  const lastMove = state.history.pop();
  if (!lastMove) { return; }

  if (lastMove.eliminated) {
    if (lastMove.turnOwner !== state.turnOwner) {
      setStatus("Cannot undo eliminations from previous turns.", "error");
      state.history.push(lastMove);
      return;
    }
    state.yourEliminated.delete(lastMove.index);
    state.eliminatedTurn.delete(lastMove.index);
  } else {
    state.yourEliminated.add(lastMove.index);
    state.eliminatedTurn.set(lastMove.index, state.turnCounter);
  }

  state.yourRemaining = getRemainingCount(state.yourEliminated);
  renderCounts();
  renderBoards();

  if (isChannelOpen()) {
    sendTileToggle(lastMove.index, lastMove.eliminated);
    sendCountUpdate();
  }

  setStatus("Last local elimination was undone.");
}

function handleNewGameRequest() {
  if (!state.isHost || (state.roundResult !== "win" && state.roundResult !== "lose")) { return; }

  const seed = createSeed();
  initializeBoard(state.modeId, seed);
  dom.modeSelect.disabled = false;
  dom.startGameSection.hidden = false;
  setStatus("New game ready. Click Start Game to begin a new round.");

  if (isChannelOpen()) {
    sendReset(seed);
    sendSync();
  }
}

function startFreshRound(seed, source) {
  initializeBoard(state.modeId, seed);
  setStatus(source === "remote" ? "Remote round reset received. New shuffled board loaded." : "Fresh round started with a new shuffle.");
}

function handleResetRequest() {
  if (!state.board.length) { return; }

  const seed = createSeed();
  startFreshRound(seed, "local");
  if (state.isHost) {
    dom.modeSelect.disabled = false;
    dom.startGameSection.hidden = false;
  }
  if (isChannelOpen()) {
    sendReset(seed);
    sendSync();
  }
}

function passQuestionControl() {
  if (!state.board.length || !isChannelOpen() || state.roundLocked) { return; }

  if (state.turnPhase === "setup") {
    if (getTurnRole() !== "pick" || state.secretIndex === null) { return; }

    if (state.turnOwner === "host") {
      state.turnOwner = "joiner";
      renderBoards();
      sendTurnUpdate();
      setStatus("Your secret is locked in. The other player can now choose their secret.");
      return;
    }

    state.turnPhase = "play";
    state.turnOwner = "host";
    state.turnCounter = 1;
    renderBoards();
    sendTurnUpdate();
    setStatus("Both secrets are selected. The question round begins with the host asking first.");
    return;
  }

  if (getTurnRole() !== "question") { return; }

  state.turnOwner = state.turnOwner === "host" ? "joiner" : "host";
  state.turnCounter++;
  renderBoards();
  sendTurnUpdate();
  setStatus("Question control passed to the other player.");
}

function validateRemoteMessage(message) {
  if (!message || typeof message !== "object") { return false; }
  if (!Object.values(MESSAGE_TYPES).includes(message.type)) { return false; }

  const count = getCharacterCountForMode(state.modeId);

  if (message.type === MESSAGE_TYPES.MODE_INIT || message.type === MESSAGE_TYPES.RESET) {
    const baseValid = typeof message.mode === "string" && Boolean(getModeById(message.mode)) && typeof message.shuffleSeed === "string";
    const mySlotValid = !message.mySlotShuffle || (Array.isArray(message.mySlotShuffle) && message.mySlotShuffle.length === 25);
    const oppSlotValid = !message.opponentSlotShuffle || (Array.isArray(message.opponentSlotShuffle) && message.opponentSlotShuffle.length === 25);
    return baseValid && mySlotValid && oppSlotValid;
  }

  if (message.type === MESSAGE_TYPES.TURN_UPDATE) {
    return (message.turnPhase === "setup" || message.turnPhase === "play") && (message.turnOwner === "host" || message.turnOwner === "joiner");
  }

  if (message.type === MESSAGE_TYPES.TILE_TOGGLE) {
    return Number.isInteger(message.index) && message.index >= 0 && message.index < count && typeof message.eliminated === "boolean";
  }

  if (message.type === MESSAGE_TYPES.COUNT_UPDATE) {
    return Number.isInteger(message.remaining) && message.remaining >= 0 && message.remaining <= count;
  }

  if (message.type === MESSAGE_TYPES.SYNC) {
    const baseValid = Number.isInteger(message.remaining)
      && message.remaining >= 0
      && message.remaining <= count
      && Array.isArray(message.eliminated)
      && message.eliminated.every(function(idx) { return Number.isInteger(idx) && idx >= 0 && idx < count; })
      && (message.turnPhase === "setup" || message.turnPhase === "play")
      && (message.turnOwner === "host" || message.turnOwner === "joiner");
    const slotValid = !message.slotShuffle || (Array.isArray(message.slotShuffle) && message.slotShuffle.length === 25);
    return baseValid && slotValid;
  }

  if (message.type === MESSAGE_TYPES.GUESS_REQUEST) {
    return Number.isInteger(message.index) && message.index >= 0 && message.index < count;
  }

  if (message.type === MESSAGE_TYPES.GUESS_RESULT) {
    return Number.isInteger(message.index) && message.index >= 0 && message.index < count && typeof message.correct === "boolean";
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
      if (message.opponentSlotShuffle) {
        state.mySlotShuffle = message.opponentSlotShuffle;
      }
      if (message.mySlotShuffle) {
        state.opponentSlotShuffle = message.mySlotShuffle;
      }
      dom.modeSelect.value = message.mode;
      dom.modeSelect.disabled = true;
      setStatus("Connected round ready. " + getModeById(message.mode).label + " board loaded.");
      if (isChannelOpen()) { sendSync(); }
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
      state.turnPhase = message.turnPhase;
      state.turnOwner = message.turnOwner;
      if (message.slotShuffle) {
        state.mySlotShuffle = message.slotShuffle;
      }
      applyOpponentCount(message.remaining);
      renderBoards();
      setStatus("Remote board resynced.");
      break;

    case MESSAGE_TYPES.RESET:
      state.modeId = message.mode;
      startFreshRound(message.shuffleSeed, "remote");
      break;

    case MESSAGE_TYPES.TURN_UPDATE:
      state.turnPhase = message.turnPhase;
      state.turnOwner = message.turnOwner;
      renderBoards();
      if (state.turnPhase === "setup") {
        setStatus(getTurnRole() === "pick" ? "It is now your turn to choose your secret." : "Waiting for the other player to choose their secret.");
      } else {
        setStatus(getTurnRole() === "question" ? "It is now your turn to ask questions." : "Question control passed to the other player.");
      }
      break;

    case MESSAGE_TYPES.GUESS_REQUEST: {
      const guessedCharacter = state.board[message.index];
      const correct = state.secretIndex !== null && message.index === state.secretIndex;
      sendGuessResult(message.index, correct);
      if (correct) {
        lockRoundWithResult("lose", "Opponent guessed correctly with " + guessedCharacter.name + ". Round locked until reset.");
      } else {
        setStatus("Opponent guessed " + guessedCharacter.name + ". Incorrect.");
      }
      return;
    }

    case MESSAGE_TYPES.GUESS_RESULT: {
      const guessedCharacter = state.board[message.index];
      if (message.correct) {
        lockRoundWithResult("win", "Correct. " + guessedCharacter.name + " was the right guess. Round locked until reset.");
      } else {
        applyWrongGuessElimination(message.index);
        setStatus("Incorrect. " + guessedCharacter.name + " was eliminated from your board and the round continues.");
      }
      return;
    }
  }
}

function closePeerConnection() {
  if (state.dataChannel) {
    state.dataChannel.onopen = null;
    state.dataChannel.onclose = null;
    state.dataChannel.onerror = null;
    state.dataChannel.onmessage = null;
    try { state.dataChannel.close(); } catch (error) { }
  }

  if (state.peerConnection) {
    state.peerConnection.ondatachannel = null;
    state.peerConnection.onconnectionstatechange = null;
    state.peerConnection.oniceconnectionstatechange = null;
    try { state.peerConnection.close(); } catch (error) { }
  }

  state.peerConnection = null;
  state.dataChannel = null;
  document.body.classList.remove('joiner');
}

function attachDataChannel(channel) {
  state.dataChannel = channel;

  channel.onopen = function() {
    updateConnectionStatus("connected", "Connected");
    collapseConnectionPanel();
    renderBoards();
    setStatus("Peer connection open. Board updates will sync live.");
    if (state.isHost) {
      dom.modeSelect.disabled = false;
      dom.startGameSection.hidden = false;
      document.body.classList.remove('joiner');
    } else {
      document.body.classList.add('joiner');
    }
    if (state.isHost && state.board.length) {
      sendModeInit();
      sendSync();
    } else if (state.board.length) {
      sendSync();
    }
  };

channel.onclose = function() {
    updateConnectionStatus("disconnected", "Disconnected");
    dom.modeSelect.disabled = false;
    dom.startGameSection.hidden = true;
    document.body.classList.remove('joiner');
    renderBoards();
    setStatus("Data channel closed. Reconnect by exchanging a new offer/answer.", "error");
  };

  channel.onerror = function() {
    updateConnectionStatus("error", "Connection error");
    dom.modeSelect.disabled = false;
    dom.startGameSection.hidden = true;
    document.body.classList.remove('joiner');
    renderBoards();
    setStatus("A data channel error occurred.", "error");
  };

  channel.onerror = function() {
    updateConnectionStatus("error", "Connection error");
    dom.modeSelect.disabled = false;
    dom.startGameSection.hidden = true;
    renderBoards();
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

  peerConnection.ondatachannel = function(event) {
    attachDataChannel(event.channel);
  };

  peerConnection.onconnectionstatechange = function() {
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

  peerConnection.oniceconnectionstatechange = function() {
    if (peerConnection.iceConnectionState === "failed") {
      updateConnectionStatus("error", "ICE failed");
    }
  };

  state.peerConnection = peerConnection;
  return peerConnection;
}

function updateLocalSignalOutput(peerConnection) {
  if (!peerConnection.localDescription) { return; }
  dom.localSignalOutput.value = JSON.stringify(peerConnection.localDescription);
}

function waitForIceGatheringComplete(peerConnection, timeoutMs) {
  timeoutMs = timeoutMs || 4000;
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve("complete");
  }

  return new Promise(function(resolve) {
    var timeoutId = setTimeout(function() {
      peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve("timeout");
    }, timeoutMs);

    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        clearTimeout(timeoutId);
        peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve("complete");
      }
    }

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
  });
}

async function createOfferFlow() {
  try {
    state.isHost = true;
    updateConnectionStatus("connecting", "Creating offer");
    setStatus("Creating peer offer...");

    const peerConnection = createPeerConnection();
    const channel = peerConnection.createDataChannel("whos-left");
    attachDataChannel(channel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    updateLocalSignalOutput(peerConnection);
    
    const copied = await autoCopyToClipboard(dom.localSignalOutput.value);
    setStatus(copied ? "Offer copied! Send it to the other player." : "Offer ready. Copy and send it to the other player.");

    Promise.race([
      waitForIceGatheringComplete(peerConnection),
      new Promise(r => setTimeout(r, 5000))
    ]).then(function() {
      updateLocalSignalOutput(peerConnection);
      autoCopyToClipboard(dom.localSignalOutput.value);
    });
  } catch (error) {
    console.error("createOfferFlow error:", error);
    updateConnectionStatus("error", "Offer failed");
    setStatus("Failed to create offer: " + error.message, "error");
  }
}

function startGame() {
  if (!state.isHost) { return; }
  if (!dom.modeSelect.value) {
    setStatus("Please select a game mode first.", "error");
    return;
  }
  
  state.modeId = dom.modeSelect.value;
  initializeBoard(state.modeId, createSeed());
  dom.modeSelect.disabled = true;
  dom.startGameSection.hidden = true;
  setStatus("Game started with " + getModeById(state.modeId).label + ". Choose your secret first.");
  
  if (isChannelOpen()) {
    sendModeInit();
    sendSync();
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
    updateLocalSignalOutput(peerConnection);
    
    const copied = await autoCopyToClipboard(dom.localSignalOutput.value);
    setStatus(copied ? "Answer copied! Send it back to the host." : "Answer created. Copy and send it back to the host.");

    Promise.race([
      waitForIceGatheringComplete(peerConnection),
      new Promise(r => setTimeout(r, 5000))
    ]).then(function() {
      updateLocalSignalOutput(peerConnection);
      autoCopyToClipboard(dom.localSignalOutput.value);
      setStatus("Answer ready. Send it back to the host.");
    });
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

async function autoCopyToClipboard(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Auto-copy failed:", error);
    return false;
  }
}

async function sendToWhatsApp(isLocal) {
  const text = isLocal ? dom.localSignalOutput.value.trim() : dom.remoteSignalInput.value.trim();
  if (!text) {
    setStatus("No signal text to send.", "error");
    return;
  }

  var message = encodeURIComponent(text);
  var whatsappUrl = "https://wa.me/?text=" + message;

  try {
    window.open(whatsappUrl, "_blank");
  } catch (error) {
    setStatus("Could not open WhatsApp. Copy the signal manually.", "error");
  }
}

async function pasteRemoteSignal() {
  try {
    var text = await navigator.clipboard.readText();
    dom.remoteSignalInput.value = text;
    setStatus("Signal pasted from clipboard.");
  } catch (error) {
    setStatus("Could not paste. Please paste manually.", "error");
  }
}

function handleModeSelection(event) {
  state.modeId = event.target.value;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  
  if (dom.themeIcon) {
    dom.themeIcon.textContent = newTheme === "light" ? "🌙" : "☀️";
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (dom.themeIcon) {
      dom.themeIcon.textContent = savedTheme === "light" ? "🌙" : "☀️";
    }
  }
}

function bootstrap() {
  try {
    initTheme();
    populateModeSelect("modeSelect");
    state.yourRemaining = 25;
    state.opponentRemaining = 25;
    if (dom.startGameSection) {
      dom.startGameSection.hidden = true;
    }
    renderCounts();
    renderBoards();
    renderBoardInfo();
    setStatus(state.statusMessage);
    updateConnectionStatus("idle", "Not connected");

    dom.createOfferBtn.addEventListener("click", createOfferFlow);
    dom.copySignalBtn.addEventListener("click", copyLocalSignal);
    dom.whatsappSignalBtn.addEventListener("click", function() { sendToWhatsApp(true); });
    dom.whatsappRemoteBtn.addEventListener("click", function() { sendToWhatsApp(false); });
    dom.pasteRemoteBtn.addEventListener("click", pasteRemoteSignal);
    dom.createAnswerBtn.addEventListener("click", createAnswerFlow);
    dom.acceptAnswerBtn.addEventListener("click", acceptAnswerFlow);
    dom.undoBtn.addEventListener("click", undoLastMove);
    dom.resyncBtn.addEventListener("click", sendSync);
    dom.passControlBtn.addEventListener("click", passQuestionControl);
    dom.resetBtn.addEventListener("click", handleResetRequest);
    dom.modeSelect.addEventListener("change", handleModeSelection);
    dom.connectionPanelToggle.addEventListener("click", toggleConnectionPanel);
    dom.newGameBtn.addEventListener("click", handleNewGameRequest);
    dom.themeToggle.addEventListener("click", toggleTheme);
    if (dom.startGameBtn) {
      dom.startGameBtn.addEventListener("click", startGame);
    }
  } catch (error) {
    console.error("Bootstrap error:", error);
    setStatus("Error during initialization.", "error");
  }
}

bootstrap();