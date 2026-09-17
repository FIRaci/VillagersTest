import { audio } from './audio.js';
import { getIcon } from './icons.js';
import { openInspector } from './inspector.js';
import { renderVillageChains } from './chain_tree.js';
import { openAiAdvisor } from './ai_advisor.js';

let ws = null;
const urlParams = new URLSearchParams(window.location.search);
let myPlayerId = urlParams.get('player') || urlParams.get('p') || localStorage.getItem('villagers_player_id') || 'p1';
let myPlayerName = urlParams.get('name') || localStorage.getItem('villagers_player_name') || 'Người Chơi 1';
let myPlayerColor = localStorage.getItem('villagers_player_color') || '#3498db';
let currentGameState = null;
let selectedCard = null;
let activeTab = 'road';

// DOM elements
const lobbyScreen = document.getElementById('lobby-screen');
const playerNameInput = document.getElementById('player-name-input');
const btnJoinLobby = document.getElementById('btn-join-lobby');
const hudAvatar = document.getElementById('hud-avatar');
const hudName = document.getElementById('hud-name');
const hudGold = document.getElementById('hud-gold');
const hudFood = document.getElementById('hud-food');
const hudBuilder = document.getElementById('hud-builder');
const hudFirstPlayer = document.getElementById('hud-first-player');
const hudTurnStatus = document.getElementById('hud-turn-status');
const hudLiveScore = document.getElementById('hud-live-score');
const hudScoreVal = document.getElementById('hud-score-val');
const hudPhaseBanner = document.getElementById('hud-phase-banner');

const tabRoad = document.getElementById('tab-road');
const tabVillage = document.getElementById('tab-village');
const tabOthers = document.getElementById('tab-others');

const viewRoad = document.getElementById('view-road');
const viewVillage = document.getElementById('view-village');
const viewOthers = document.getElementById('view-others');
const handSheet = document.getElementById('hand-sheet');
const handDragHandle = document.getElementById('hand-drag-handle');
const handCarousel = document.getElementById('hand-carousel');
const handCountLabel = document.getElementById('hand-count-label');

const cardModal = document.getElementById('card-modal');
const modalCardImg = document.getElementById('modal-card-img');
const modalCardName = document.getElementById('modal-card-name');
const modalCardDesc = document.getElementById('modal-card-desc');
const modalPadlockInfo = document.getElementById('modal-padlock-info');
const modalParentSelector = document.getElementById('modal-parent-selector');
const selectTargetParent = document.getElementById('select-target-parent');
const btnBuildCard = document.getElementById('btn-build-card');
const btnInspectModalCard = document.getElementById('btn-inspect-modal-card');
const btnCloseCardModal = document.getElementById('btn-close-card-modal');
const btnCloseCardModalX = document.getElementById('btn-close-card-modal-x');
const btnPassTurn = document.getElementById('btn-pass-turn');
const btnAiAdvisor = document.getElementById('btn-ai-advisor');
const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
const rotateHint = document.getElementById('rotate-hint');

if (btnDismissRotate && rotateHint) {
  btnDismissRotate.addEventListener('click', () => {
    rotateHint.classList.add('dismissed');
    rotateHint.style.display = 'none';
  });
}

const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const themeToggleText = document.getElementById('theme-toggle-text');

function applyTheme(theme) {
  if (theme === 'white') {
    document.body.classList.add('theme-white');
    if (themeToggleIcon) themeToggleIcon.innerHTML = getIcon('themeWood', { size: 14 });
    if (themeToggleText) themeToggleText.textContent = 'BÀN GỖ';
  } else {
    document.body.classList.remove('theme-white');
    if (themeToggleIcon) themeToggleIcon.innerHTML = getIcon('themeWhite', { size: 14 });
    if (themeToggleText) themeToggleText.textContent = 'BÀN TRẮNG';
  }
  localStorage.setItem('villagers_table_theme', theme);
}

// User requested: Default to pure white table ("bàn trắng")
const currentTheme = localStorage.getItem('villagers_table_theme') || 'white';
applyTheme(currentTheme);

const mobileScoreModal = document.getElementById('mobile-score-modal');
const mobileScoreBody = document.getElementById('mobile-score-body');
const btnCloseMobileScore = document.getElementById('btn-close-mobile-score');
const btnCloseMobileScoreX = document.getElementById('btn-close-mobile-score-x');

// Helper to map suit string to official icon asset
function suitToIcon(suit) {
  const map = {
    'Wood': 's1.png',
    'Grain': 's2.png',
    'Hay': 's3.png',
    'Ore': 's4.png',
    'Grapes': 's5.png',
    'Wool': 's6.png',
    'Leather': 's7.png',
    'Solitary': 's8.png',
    'Special': 's9.png'
  };
  return map[suit] || 's1.png';
}

// Initialize SVG icons and game assets into static elements
function initStaticIcons() {
  tabRoad.innerHTML = `${getIcon('road', { size: 16 })} <span>Con đường</span>`;
  tabVillage.innerHTML = `${getIcon('village', { size: 16 })} <span>Làng của tôi</span>`;
  tabOthers.innerHTML = `${getIcon('opponents', { size: 16 })} <span>Đối thủ</span>`;
  hudFirstPlayer.innerHTML = `<img src="/assets/icons/firstplayer.png" class="token-meeple" style="height:20px;" title="Người chơi đầu">`;
  btnCloseCardModalX.innerHTML = getIcon('close', { size: 18 });
  btnBuildCard.innerHTML = `<img src="/assets/icons/house.png" class="token-icon" style="width:16px;height:16px;"> <span>XÂY VÀO LÀNG</span>`;
  if (btnCloseMobileScoreX) {
    btnCloseMobileScoreX.innerHTML = getIcon('close', { size: 18 });
  }

  if (btnInspectModalCard) {
    btnInspectModalCard.addEventListener('click', () => {
      if (selectedCard) {
        openInspector(selectedCard, currentGameState, myPlayerId);
      }
    });
  }

  if (hudLiveScore) {
    hudLiveScore.addEventListener('click', () => {
      openMobileScoreboard();
    });
  }

  if (btnCloseMobileScore) {
    btnCloseMobileScore.addEventListener('click', () => {
      mobileScoreModal.classList.remove('open');
      audio.playButtonClick();
    });
  }

  if (btnCloseMobileScoreX) {
    btnCloseMobileScoreX.addEventListener('click', () => {
      mobileScoreModal.classList.remove('open');
      audio.playButtonClick();
    });
  }

  if (btnAiAdvisor) {
    btnAiAdvisor.addEventListener('click', () => {
      const me = currentGameState?.players.find(p => p.id === myPlayerId);
      if (!me || !currentGameState) {
        showToast("Đang tải dữ liệu bàn cờ...");
        return;
      }
      openAiAdvisor(me, currentGameState, (actionType, cardId, targetParentId) => {
        if (actionType === 'draft_card') {
          draftCard(cardId);
        } else if (actionType === 'draft_stack') {
          draftStack(cardId);
        } else if (actionType === 'build_card') {
          executeBuildCard(cardId, targetParentId);
        }
      });
    });
  }

  if (btnDismissRotate) {
    btnDismissRotate.addEventListener('click', () => {
      document.body.classList.add('portrait-dismissed');
      if (rotateHint) rotateHint.style.display = 'none';
      audio.playButtonClick();
    });
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isWhite = document.body.classList.contains('theme-white');
      applyTheme(isWhite ? 'wood' : 'white');
      audio.playButtonClick();
      showToast(isWhite ? 'Đã chuyển sang Bàn Gỗ Cổ Điển' : 'Đã chuyển sang Bàn Trắng Tinh Khiết');
    });
  }
}
initStaticIcons();

// Color picker logic
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
    myPlayerColor = dot.dataset.color;
    audio.triggerHaptic([15]);
  });
});

if (myPlayerName) {
  playerNameInput.value = myPlayerName;
}

btnJoinLobby.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    showToast('Vui lòng nhập tên của bạn!');
    return;
  }
  audio.init();
  audio.playCoinSound();
  audio.triggerHaptic([40]);
  myPlayerName = name;
  localStorage.setItem('villagers_player_name', myPlayerName);
  localStorage.setItem('villagers_player_color', myPlayerColor);
  localStorage.setItem('villagers_player_id', myPlayerId);

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'PLAYER_JOIN',
      player: {
        id: myPlayerId,
        name: myPlayerName,
        color: myPlayerColor
      }
    }));
  }

  lobbyScreen.style.display = 'none';
});

// Tab Switcher
tabRoad.addEventListener('click', () => switchTab('road'));
tabVillage.addEventListener('click', () => switchTab('village'));
tabOthers.addEventListener('click', () => switchTab('others'));

function switchTab(tab) {
  if (activeTab === tab) return;
  activeTab = tab;
  audio.playCardSlideSound();
  audio.triggerHaptic([20]);

  document.querySelectorAll('.nav-pill').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  viewRoad.style.display = tab === 'road' ? 'flex' : 'none';
  viewVillage.style.display = tab === 'village' ? 'block' : 'none';
  viewOthers.style.display = tab === 'others' ? 'block' : 'none';

  if (currentGameState) {
    renderTabContent(currentGameState);
  }
}

// Hand Drawer collapse toggle
let isDrawerCollapsed = false;
if (handDragHandle) {
  handDragHandle.addEventListener('click', () => {
    isDrawerCollapsed = !isDrawerCollapsed;
    handCarousel.style.display = isDrawerCollapsed ? 'none' : 'flex';
    handDragHandle.style.opacity = isDrawerCollapsed ? '0.4' : '1';
    audio.triggerHaptic([10]);
  });
}

// WebSocket connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    if (myPlayerName) {
      ws.send(JSON.stringify({
        type: 'PLAYER_JOIN',
        player: {
          id: myPlayerId,
          name: myPlayerName,
          color: myPlayerColor
        }
      }));
      lobbyScreen.style.display = 'none';
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'GAME_STATE') {
        currentGameState = data.state;
        updateUI(currentGameState);
      } else if (data.type === 'TOAST') {
        showToast(data.message);
        audio.playCardPlaceSound();
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  };

  ws.onclose = () => {
    setTimeout(connectWebSocket, 2000);
  };
}

// Update UI
function updateUI(state) {
  const me = state.players.find(p => p.id === myPlayerId);
  if (!me) return;

  // Update HUD values with official game tokens
  hudName.textContent = me.name;
  hudAvatar.style.background = me.color || '#3498db';
  hudGold.innerHTML = `<img src="/assets/icons/gold_coin.svg" class="token-icon"> <span>${me.supply_gold}</span>`;

  const foodLimit = calculateFood(me);
  const builderLimit = calculateBuilder(me);
  hudFood.innerHTML = `<img src="/assets/icons/food_token.svg" class="token-icon"> <span>${foodLimit}</span>`;
  hudBuilder.innerHTML = `<img src="/assets/icons/builder_token.svg" class="token-icon"> <span>${builderLimit}</span>`;

  const liveSc = state.live_scores ? state.live_scores[myPlayerId] : null;
  if (hudScoreVal) {
    hudScoreVal.textContent = liveSc ? liveSc.projectedFinalScore : me.supply_gold;
  }

  // Phase banner indicator
  if (hudPhaseBanner && state.phase) {
    const isDraft = state.phase.type === 'DraftPhase' || ('drafted_this_round' in state.phase);
    hudPhaseBanner.innerHTML = isDraft
      ? `<span>${getIcon('draftPhase', { size: 13, style: 'vertical-align: -1px;' })} NHÁP BÀI (VÒNG ${state.phase.draft_round || 1}/2)</span>`
      : `<span>${getIcon('buildPhase', { size: 13, style: 'vertical-align: -1px;' })} XÂY DỰNG</span>`;
  }

  // First player indicator
  const isFirst = state.first_player_id === myPlayerId;
  hudFirstPlayer.style.display = isFirst ? 'inline-block' : 'none';

  // Turn status
  const activePlayer = state.players[state.phase.active_player_index || 0];
  const isMyTurn = activePlayer && activePlayer.id === myPlayerId;
  btnPassTurn.style.display = isMyTurn ? 'inline-flex' : 'none';
  if (isMyTurn) {
    btnPassTurn.classList.add('my-turn-active');
  } else {
    btnPassTurn.classList.remove('my-turn-active');
  }
  hudTurnStatus.style.display = isMyTurn ? 'inline-block' : 'none';

  // Keyed DOM Reconciliation for Hand Carousel
  reconcileHandCarousel(me.hand, me, state);

  renderTabContent(state);
}

// Keyed DOM reconciliation for Hand Carousel (Preserves scroll!)
function reconcileHandCarousel(cards, me, state) {
  handCountLabel.innerHTML = `${getIcon('deck', { size: 15 })} <span>BÀI TAY (${cards.length})</span>`;

  const existingMap = new Map();
  Array.from(handCarousel.children).forEach(el => {
    existingMap.set(el.dataset.cardId, el);
  });

  const newIds = new Set(cards.map(c => String(c.id)));

  // Remove stale cards
  existingMap.forEach((el, id) => {
    if (!newIds.has(id)) {
      el.remove();
    }
  });

  // Append or update cards
  cards.forEach(card => {
    const id = String(card.id);
    let cardDiv = existingMap.get(id);

    if (!cardDiv) {
      cardDiv = document.createElement('div');
      cardDiv.className = 'villager-card';
      cardDiv.dataset.cardId = id;
      cardDiv.title = card.name;

      // Clean white card fallback face
      const suitIcon = `/assets/icons/${suitToIcon(card.suit)}`;
      const suitColors = {
        'Wood': '#658a69',
        'Grain': '#b58d3d',
        'Hay': '#8c769f',
        'Ore': '#647b87',
        'Grapes': '#b56980',
        'Wool': '#5e8ba3',
        'Leather': '#b07955',
        'Solitary': '#87786b',
        'Special': '#b56258'
      };
      const suitColor = suitColors[card.suit] || '#87786b';

      let statsList = [];
      if (card.gold > 0) statsList.push(`${card.gold}<img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">`);
      if (card.food > 0) statsList.push(`${card.food}<img src="/assets/icons/food_token.svg" class="token-inline" alt="Lương thực">`);
      if (card.builder > 0) statsList.push(`${card.builder}<img src="/assets/icons/builder_token.svg" class="token-inline" alt="Thợ xây">`);

      cardDiv.innerHTML = `
        <div class="card-clean-white-face">
          <div class="card-white-suit-ribbon" style="background: ${suitColor}">
            <img src="${suitIcon}"> <span>${card.suit || 'Base'}</span>
          </div>
          <div class="card-white-body">
            <div class="card-white-name">${card.name}</div>
            ${card.placed_on && card.placed_on.length > 0 ? `<div class="card-white-placed-on">Nối: ${card.placed_on.join('/')}</div>` : ''}
          </div>
          ${statsList.length > 0 ? `<div class="card-white-stats-row">${statsList.join(' ')}</div>` : ''}
        </div>
      `;

      if (card.primary_image) {
        const img = new Image();
        img.src = `/${card.primary_image}`;
        img.onload = () => {
          cardDiv.style.backgroundImage = `url('/${card.primary_image}')`;
          cardDiv.classList.add('has-art');
        };
        img.onerror = () => {
          cardDiv.classList.add('is-fallback-white');
        };
      } else {
        cardDiv.classList.add('is-fallback-white');
      }

      // Alt-Zoom on Long Press (450ms)
      let touchTimer = null;
      cardDiv.addEventListener('touchstart', (e) => {
        touchTimer = setTimeout(() => {
          openInspector(card, state, myPlayerId);
        }, 450);
      }, { passive: true });
      cardDiv.addEventListener('touchend', () => clearTimeout(touchTimer));
      cardDiv.addEventListener('touchmove', () => clearTimeout(touchTimer));

      // Tap card
      cardDiv.addEventListener('click', () => {
        handleHandCardClick(card, me, state);
      });
      handCarousel.appendChild(cardDiv);
    }

    // Check if card is playable in village
    const canBuild = !card.placed_on || card.placed_on.length === 0 || me.village.some(v => card.placed_on.includes(v.code));
    if (canBuild) {
      cardDiv.classList.add('playable');
      cardDiv.style.borderColor = 'var(--suit-wood)';
    } else {
      cardDiv.classList.remove('playable');
      cardDiv.style.borderColor = 'var(--border-delicate)';
    }

    if (selectedCard && String(selectedCard.id) === id) {
      cardDiv.classList.add('selected');
    } else {
      cardDiv.classList.remove('selected');
    }
  });
}

function handleHandCardClick(card, me, state) {
  audio.playCardSlideSound();
  audio.triggerHaptic([25]);

  // If already selected, open the full modal (so user can inspect details/padlocks)
  if (selectedCard && selectedCard.id === card.id) {
    openCardModal(card, me, state);
    return;
  }

  // Select card
  selectedCard = card;

  // Update visual selection across rack
  Array.from(handCarousel.children).forEach(el => {
    if (el.dataset.cardId === String(card.id)) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });

  // If in village tab or building phase, switch to village and highlight snap targets
  if (activeTab !== 'village') {
    switchTab('village');
  } else {
    renderMyVillage(me);
  }

  const hasParents = card.placed_on && card.placed_on.length > 0;
  if (hasParents) {
    showToast(`Đã chọn ${card.name}. Chạm vào thẻ sáng trên sân để hít vào ngay!`);
  } else {
    showToast(`Đã chọn ${card.name} (cơ sở). Bấm ĐẶT NGAY để xây!`);
  }
}

const SUIT_META = {
  grain: { name: 'Lúa mì', en: 'GRAINS', color: '#b58d3d' },
  wood: { name: 'Gỗ', en: 'WOOD', color: '#658a69' },
  hay: { name: 'Cỏ khô', en: 'HAY', color: '#8c769f' },
  ore: { name: 'Quặng mỏ', en: 'ORE', color: '#647b87' },
  grapes: { name: 'Nho', en: 'GRAPES', color: '#b56980' },
  wool: { name: 'Len dạ', en: 'WOOL', color: '#5e8ba3' },
  leather: { name: 'Da thuộc', en: 'LEATHER', color: '#b07955' },
  solitary: { name: 'Độc hành', en: 'SOLITARY', color: '#87786b' },
  special: { name: 'Đặc biệt', en: 'SPECIAL', color: '#b56258' },
  default: { name: 'Dân làng', en: 'VILLAGERS', color: '#87786b' }
};

function renderTabContent(state) {
  const me = state.players.find(p => p.id === myPlayerId);
  if (!me) return;

  if (activeTab === 'road') {
    reconcileRoad(state.road, state);
  } else if (activeTab === 'village') {
    renderMyVillage(me);
  } else if (activeTab === 'others') {
    renderOthers(state);
  }
}

// Keyed DOM reconciliation for 6-Station Road Column Layout
// Unifies Reserve Stacks (top) and Face-up Market Cards (bottom) into 6 parallel stations
function reconcileRoad(roadState, state) {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const activePlayer = state.players[state.phase.active_player_index || 0];
  const isMyTurn = activePlayer && activePlayer.id === myPlayerId;
  const isDraftPhase = state.phase.type === 'DraftPhase' || ('drafted_this_round' in state.phase) || (state.phase.type === 'draft');

  // 1. Ensure persistent container structure inside viewRoad
  let stationsGrid = document.getElementById('mobile-road-stations');
  if (!stationsGrid) {
    viewRoad.innerHTML = `
      <div class="mobile-road-stations-wrapper">
        <div class="road-stations-header-ribbon">
          <div class="road-ribbon-title">
            <img src="/assets/icons/deck.svg" class="token-icon" style="width:13px;height:13px;">
            <span>6 TRẠM CON ĐƯỜNG (ROAD)</span>
          </div>
          <div class="road-ribbon-sub">
            <span class="ribbon-legend-item"><span class="legend-dot" style="background:#5e8ba3;"></span> Cọc trên: Thấy Hệ</span>
            <span class="ribbon-sep">•</span>
            <span class="ribbon-legend-item"><span class="legend-dot" style="background:#b58d3d;"></span> Lá dưới: Mở (+Vàng)</span>
          </div>
        </div>
        <div class="mobile-road-stations" id="mobile-road-stations"></div>
      </div>
    `;
    stationsGrid = document.getElementById('mobile-road-stations');
  }

  // 2. Render all 6 Station Columns
  stationsGrid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const stack = roadState.stacks ? (roadState.stacks[i] || []) : [];
    const faceUpCard = roadState.face_up ? roadState.face_up[i] : null;

    const col = document.createElement('div');
    col.className = 'road-station-col';
    col.dataset.stationIndex = String(i);

    // Header: Roman Numeral & Market tag
    const header = document.createElement('div');
    header.className = 'station-col-header';
    header.innerHTML = `
      <span class="station-roman">CỌC ${romanNumerals[i]}</span>
      ${i === 1 ? `<span class="station-market-tag">${getIcon('market', { size: 11, style: 'vertical-align: -1px;' })} CHỢ 1</span>` : ''}
      ${i === 5 ? `<span class="station-market-tag">${getIcon('market', { size: 11, style: 'vertical-align: -1px;' })} CHỢ 2</span>` : ''}
    `;
    col.appendChild(header);

    // Top: Reserve Stack Card
    const stackWrapper = document.createElement('div');
    stackWrapper.className = 'station-stack-wrapper';

    const stackCard = document.createElement('div');
    stackCard.className = 'station-stack-card';

    if (stack.length > 0) {
      const topCard = stack[0];
      const suitKey = (topCard.suit || 'default').toLowerCase();
      const meta = SUIT_META[suitKey] || SUIT_META.default;

      stackCard.style.backgroundImage = `url('/assets/backs/back_${suitKey}.svg')`;
      stackCard.style.borderColor = meta.color;
      stackCard.title = `Cọc ${romanNumerals[i]}: Đỉnh cọc là hệ ${meta.name} (${meta.en}) - Còn ${stack.length} lá`;

      const canDraft = isMyTurn && isDraftPhase;

      stackCard.innerHTML = `
        <div class="deck-count-badge">${stack.length} lá</div>
        <div class="station-stack-ribbon ${canDraft ? 'can-draft' : ''}">
          <span>${canDraft ? `LẤY CỌC` : `HỆ ${meta.name.toUpperCase()}`}</span>
        </div>
      `;

      stackCard.addEventListener('click', () => {
        if (!isMyTurn) {
          showToast("Chưa đến lượt của bạn");
          return;
        }
        draftStack(i, meta.name);
      });
    } else {
      stackCard.classList.add('deck-stack-empty');
      stackCard.innerHTML = `
        <div class="deck-empty-label">HẾT BÀI</div>
      `;
    }
    stackWrapper.appendChild(stackCard);
    col.appendChild(stackWrapper);

    // Subtle divider line
    const divider = document.createElement('div');
    divider.className = 'station-lane-divider';
    col.appendChild(divider);

    // Bottom: Face-up Market Card
    const marketWrapper = document.createElement('div');
    marketWrapper.className = 'station-market-wrapper';

    if (faceUpCard) {
      const marketCard = document.createElement('div');
      marketCard.className = 'station-market-card';
      marketCard.dataset.cardId = String(faceUpCard.id);
      marketCard.title = `${faceUpCard.name} (${faceUpCard.suit || 'Base'})`;

      const suitIcon = `/assets/icons/${suitToIcon(faceUpCard.suit)}`;
      const suitColors = {
        'Wood': '#658a69', 'Grain': '#b58d3d', 'Hay': '#8c769f',
        'Ore': '#647b87', 'Grapes': '#b56980', 'Wool': '#5e8ba3',
        'Leather': '#b07955', 'Solitary': '#87786b', 'Special': '#b56258'
      };
      const suitColor = suitColors[faceUpCard.suit] || '#b58d3d';

      let statsList = [];
      if (faceUpCard.gold > 0) statsList.push(`${faceUpCard.gold}<img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">`);
      if (faceUpCard.food > 0) statsList.push(`${faceUpCard.food}<img src="/assets/icons/food_token.svg" class="token-inline" alt="Lương thực">`);
      if (faceUpCard.builder > 0) statsList.push(`${faceUpCard.builder}<img src="/assets/icons/builder_token.svg" class="token-inline" alt="Thợ xây">`);

      marketCard.innerHTML = `
        <div class="card-clean-white-face">
          <div class="card-white-suit-ribbon" style="background: ${suitColor}">
            <img src="${suitIcon}"> <span>${faceUpCard.suit || 'Base'}</span>
          </div>
          <div class="card-white-body">
            <div class="card-white-name">${faceUpCard.name}</div>
            ${faceUpCard.placed_on && faceUpCard.placed_on.length > 0 ? `<div class="card-white-placed-on">Nối: ${faceUpCard.placed_on.join('/')}</div>` : ''}
          </div>
          ${statsList.length > 0 ? `<div class="card-white-stats-row">${statsList.join(' ')}</div>` : ''}
        </div>
      `;

      if (faceUpCard.primary_image) {
        const img = new Image();
        img.src = `/${faceUpCard.primary_image}`;
        img.onload = () => {
          marketCard.style.backgroundImage = `url('/${faceUpCard.primary_image}')`;
          marketCard.classList.add('has-art');
        };
        img.onerror = () => {
          marketCard.classList.add('is-fallback-white');
        };
      } else {
        marketCard.classList.add('is-fallback-white');
      }

      // Coin cluster badge
      if (faceUpCard.coins > 0) {
        const coinsCluster = document.createElement('div');
        coinsCluster.className = 'card-coins-cluster';
        coinsCluster.innerHTML = `
          <img src="/assets/icons/gold_coin.svg" alt="Gold">
          <span>+${faceUpCard.coins}</span>
        `;
        marketCard.appendChild(coinsCluster);
      }

      // Quick Inspect Icon button
      const inspectBtn = document.createElement('button');
      inspectBtn.className = 'station-card-inspect-btn';
      inspectBtn.title = 'Soi chi tiết thẻ bài';
      inspectBtn.innerHTML = getIcon('search', { size: 12 });
      inspectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openInspector(faceUpCard, state, myPlayerId);
      });
      marketCard.appendChild(inspectBtn);

      // Draft ribbon at bottom
      const canDraft = isMyTurn && isDraftPhase;
      const ribbon = document.createElement('div');
      ribbon.className = `station-market-ribbon ${canDraft ? 'can-draft' : ''}`;
      ribbon.innerHTML = canDraft
        ? (faceUpCard.coins > 0
            ? `<img src="/assets/icons/gold_coin.svg" class="token-icon" style="width:12px;height:12px;"> <span>LẤY (+${faceUpCard.coins} Vàng)</span>`
            : `<span>LẤY LÁ NÀY</span>`)
        : `<span>${faceUpCard.name}</span>`;
      marketCard.appendChild(ribbon);

      // Click card
      marketCard.addEventListener('click', () => {
        if (canDraft) {
          draftCard(faceUpCard.id);
        } else {
          openInspector(faceUpCard, state, myPlayerId);
        }
      });

      // Long press (400ms) for inspector
      let touchTimer = null;
      marketCard.addEventListener('touchstart', () => {
        touchTimer = setTimeout(() => {
          openInspector(faceUpCard, state, myPlayerId);
        }, 400);
      }, { passive: true });
      marketCard.addEventListener('touchend', () => clearTimeout(touchTimer));
      marketCard.addEventListener('touchmove', () => clearTimeout(touchTimer));

      marketWrapper.appendChild(marketCard);
    } else {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'station-market-empty';
      emptyCard.innerHTML = `<span>TRỐNG</span>`;
      marketWrapper.appendChild(emptyCard);
    }

    col.appendChild(marketWrapper);
    stationsGrid.appendChild(col);
  }
}

function draftStack(stackIndex, suitName) {
  audio.playCardSlideSound();
  audio.playCardPlaceSound();
  audio.triggerHaptic([35, 25]);
  showToast(`Đã lấy 1 lá úp hệ ${suitName || 'dân làng'} từ Cọc ${stackIndex + 1}!`);
  ws.send(JSON.stringify({
    type: 'PLAYER_ACTION',
    action: {
      type: 'draft_face_down',
      playerId: myPlayerId,
      stackIndex: stackIndex
    }
  }));
}

function draftCard(cardId) {
  audio.playCardSlideSound();
  audio.playCoinSound();
  audio.triggerHaptic([30, 20]);
  ws.send(JSON.stringify({
    type: 'PLAYER_ACTION',
    action: {
      type: 'draft_face_up',
      playerId: myPlayerId,
      cardId: cardId
    }
  }));
}

// Village Tree Rendering with Branching & Snap Targets
function renderMyVillage(me) {
  const isBaseCard = selectedCard && (!selectedCard.placed_on || selectedCard.placed_on.length === 0);
  const baseCardActionHtml = isBaseCard ? `
    <div style="background: var(--suit-wood-bg); border: 1.5px solid var(--suit-wood-border); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 6px rgba(101, 138, 105, 0.1);">
      <div>
        <strong style="color: var(--suit-wood); font-size: 13px;">✦ ĐẶT DÂN LÀNG CƠ SỞ: ${selectedCard.name}</strong>
        <div style="font-size: 11px; color: var(--text-secondary);">Lá này không cần thẻ cha, xây thẳng vào Làng!</div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-snap-base-card" style="padding: 6px 14px; font-size: 12px;">
        ĐẶT NGAY
      </button>
    </div>
  ` : '';

  viewVillage.innerHTML = `
    ${baseCardActionHtml}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="color: var(--text-primary); font-size: 15px; letter-spacing: 0.04em; margin: 0;">CÂY SẢN XUẤT CỦA BẠN</h3>
      <span style="font-size: 12px; color: var(--text-secondary);">Tổng ${me.village.length} Dân Làng</span>
    </div>
    <div class="village-container" id="my-village-chains"></div>
  `;

  if (isBaseCard) {
    const btnSnapBase = document.getElementById('btn-snap-base-card');
    if (btnSnapBase) {
      btnSnapBase.addEventListener('click', () => {
        executeBuildCard(selectedCard.id, null);
      });
    }
  }

  const container = document.getElementById('my-village-chains');
  const validParents = (selectedCard && selectedCard.placed_on) ? selectedCard.placed_on : [];

  renderVillageChains(container, me.village, {
    gameState: currentGameState,
    activePlayerId: myPlayerId,
    highlightedParentCodes: validParents,
    onSelectParent: (parentCard) => {
      // ONE-TAP SNAP PLACEMENT: If card is currently selected from hand, build directly!
      if (selectedCard) {
        showToast(`✦ Đã gắn ${selectedCard.name} lên ${parentCard.name}!`);
        executeBuildCard(selectedCard.id, parentCard.id);
      } else {
        openInspector(parentCard, currentGameState, myPlayerId);
      }
    }
  });
}

// Opponents view with Branching Tree
function renderOthers(state) {
  viewOthers.innerHTML = '';
  const others = state.players.filter(p => p.id !== myPlayerId);

  if (others.length === 0) {
    viewOthers.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 30px;">Chưa có người chơi đối thủ nào tham gia bàn.</div>`;
    return;
  }

  others.forEach(p => {
    const box = document.createElement('div');
    box.className = 'panel';
    box.style.padding = '14px';
    box.style.marginBottom = '14px';
    box.style.background = '#ffffff';
    box.style.border = '1.5px solid var(--border-delicate)';
    box.style.borderRadius = 'var(--radius-lg)';
    box.style.boxShadow = 'var(--shadow-sm)';
    const liveSc = state.live_scores ? state.live_scores[p.id] : null;
    const projected = liveSc ? liveSc.projectedFinalScore : p.supply_gold;

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 18px; height: 18px; border-radius: 50%; background: ${p.color || '#5e8ba3'}; border: 1.5px solid #fff;"></div>
          <strong style="font-size: 14.5px; color: var(--text-primary);">${p.name}</strong>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="badge-coin tabular-nums"><img src="/assets/icons/gold_coin.svg" class="token-icon"> <span>${p.supply_gold}</span></span>
          <span class="badge-food tabular-nums"><img src="/assets/icons/food_token.svg" class="token-icon"> <span>${calculateFood(p)}</span></span>
          <span class="badge-builder tabular-nums"><img src="/assets/icons/builder_token.svg" class="token-icon"> <span>${calculateBuilder(p)}</span></span>
          <span class="badge-pill tabular-nums" style="background: var(--badge-coin-bg); border: 1px solid var(--badge-coin-border); color: var(--badge-coin-text); font-weight: 700; font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px;">
            ${getIcon('trophy', { size: 12, style: 'vertical-align: -1px;' })} <span>${projected}</span>
          </span>
        </div>
      </div>
      <div class="village-container" id="other-village-${p.id}"></div>
    `;
    viewOthers.appendChild(box);
    renderVillageChains(document.getElementById(`other-village-${p.id}`), p.village, {
      gameState: state,
      activePlayerId: p.id
    });
  });
}

// Card Detail & Build Modal
function openCardModal(card, me, state) {
  selectedCard = card;
  audio.playCardSlideSound();
  audio.triggerHaptic([20]);

  modalCardImg.style.backgroundImage = `url('/${card.primary_image}')`;
  modalCardName.textContent = card.name;
  modalCardDesc.textContent = `Bộ: ${card.suit || 'N/A'} | Vàng: ${card.gold || 0} | Lương thực: ${card.food || 0} | Thợ xây: ${card.builder || 0}`;

  // Smart Padlock & Key Matrix
  if (card.has_padlock && card.unlocked_by) {
    modalPadlockInfo.style.display = 'flex';
    const selfHas = me.village.some(c => c.code === card.unlocked_by);
    if (selfHas) {
      modalPadlockInfo.className = 'padlock-card-box unlocked';
      modalPadlockInfo.innerHTML = `
        ${getIcon('padlockUnlocked', { size: 22 })}
        <div>
          <strong style="color: var(--suit-wood);">ĐÃ MỞ KHÓA! (TỰ SỞ HỮU)</strong><br>
          Làng bạn có <em>${card.unlocked_by}</em>. Miễn phí và nhận <strong>2 Vàng từ Ngân hàng</strong>!
        </div>
      `;
    } else {
      const otherWithKey = state.players.find(p => p.id !== me.id && p.village.some(c => c.code === card.unlocked_by));
      if (otherWithKey) {
        modalPadlockInfo.className = 'padlock-card-box locked';
        modalPadlockInfo.innerHTML = `
          ${getIcon('padlockLocked', { size: 22 })}
          <div>
            <strong style="color: #a84242;">KHÓA BẢN QUYỀN!</strong><br>
            Cần <em>${card.unlocked_by}</em>. <strong>${otherWithKey.name}</strong> đang giữ.<br>
            Bạn phải trả <strong>2 Vàng cho ${otherWithKey.name}</strong>!
          </div>
        `;
      } else {
        modalPadlockInfo.className = 'padlock-card-box locked';
        modalPadlockInfo.innerHTML = `
          ${getIcon('padlockLocked', { size: 22 })}
          <div>
            <strong style="color: var(--badge-builder-text);">YÊU CẦU KHÓA: ${card.unlocked_by}</strong><br>
            Chưa ai sở hữu. Trả <strong>2 Vàng cho Ngân hàng</strong> khi xây!
          </div>
        `;
      }
    }
  } else {
    modalPadlockInfo.style.display = 'none';
  }

  // Parent selector
  selectTargetParent.innerHTML = '';
  if (card.placed_on && card.placed_on.length > 0) {
    modalParentSelector.style.display = 'block';
    const validParents = me.village.filter(c => card.placed_on.includes(c.code));

    if (validParents.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = `(Chưa có ${card.placed_on.join('/')} trong Làng)`;
      selectTargetParent.appendChild(opt);
      btnBuildCard.disabled = true;
      btnBuildCard.style.opacity = '0.5';
    } else {
      validParents.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (Vị trí: ${p.id})`;
        selectTargetParent.appendChild(opt);
      });
      btnBuildCard.disabled = false;
      btnBuildCard.style.opacity = '1';
    }
  } else {
    modalParentSelector.style.display = 'none';
    btnBuildCard.disabled = false;
    btnBuildCard.style.opacity = '1';
  }

  cardModal.classList.add('open');

  // Also update village view so valid parent snap points pulse with golden light!
  if (activeTab === 'village') {
    renderMyVillage(me);
  }
}

btnCloseCardModal.addEventListener('click', () => {
  cardModal.classList.remove('open');
  selectedCard = null;
  if (activeTab === 'village' && currentGameState) {
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    if (me) renderMyVillage(me);
  }
});
btnCloseCardModalX.addEventListener('click', () => {
  cardModal.classList.remove('open');
  selectedCard = null;
  if (activeTab === 'village' && currentGameState) {
    const me = currentGameState.players.find(p => p.id === myPlayerId);
    if (me) renderMyVillage(me);
  }
});

btnBuildCard.addEventListener('click', () => {
  if (!selectedCard) return;
  const parentId = selectTargetParent.value || null;
  executeBuildCard(selectedCard.id, parentId);
});

function executeBuildCard(cardId, targetParentId = null) {
  const me = currentGameState?.players.find(p => p.id === myPlayerId);
  const card = (me?.hand || []).find(c => c.id === cardId) || selectedCard;

  if (card && card.has_padlock) {
    audio.playLockUnlockSound();
  } else {
    audio.playCardSnapSound();
  }
  audio.triggerHaptic([40, 20]);

  ws.send(JSON.stringify({
    type: 'PLAYER_ACTION',
    action: {
      type: 'build',
      playerId: myPlayerId,
      cardId: cardId,
      targetParentId: targetParentId
    }
  }));

  if (cardModal) cardModal.classList.remove('open');
  selectedCard = null;
  if (me && activeTab === 'village') {
    renderMyVillage(me);
  }
}

function openMobileScoreboard() {
  if (!currentGameState) return;
  audio.playButtonClick();
  const liveScores = currentGameState.live_scores || {};
  const me = currentGameState.players.find(p => p.id === myPlayerId);
  const myScore = (me && liveScores[myPlayerId]) ? liveScores[myPlayerId] : {
    supplyGold: me ? me.supply_gold : 0,
    market1Total: 0,
    market2Total: 0,
    silverGold: 0,
    silverBreakdown: [],
    projectedFinalScore: me ? me.supply_gold : 0
  };

  const players = [...(currentGameState.players || [])];
  players.sort((a, b) => {
    const scA = liveScores[a.id]?.projectedFinalScore ?? a.supply_gold;
    const scB = liveScores[b.id]?.projectedFinalScore ?? b.supply_gold;
    return scB - scA;
  });

  mobileScoreBody.innerHTML = `
    <!-- My Score Card -->
    <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 14px; text-align: center; box-shadow: var(--shadow-sm);">
      <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">TỔNG ĐIỂM DỰ KIẾN CỦA BẠN</div>
      <div style="font-size: 30px; font-weight: 900; color: var(--badge-coin-text); margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 6px;">
        <span>${myScore.projectedFinalScore}</span>
        ${getIcon('trophy', { size: 24, style: 'vertical-align: -2px;' })}
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; font-size: 12px; background: var(--bg-surface-inset); padding: 8px; border-radius: 6px;">
        <div>
          <div style="color: var(--text-muted); font-size: 10px;">TIỀN MẶT</div>
          <strong style="color: var(--badge-coin-text); display: inline-flex; align-items: center; gap: 2px;">
            ${myScore.supplyGold} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
          </strong>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 10px;">ƯỚC CHỢ 1</div>
          <strong style="color: var(--badge-food-text); display: inline-flex; align-items: center; gap: 2px;">
            +${myScore.market1Total} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
          </strong>
        </div>
        <div>
          <div style="color: var(--text-muted); font-size: 10px;">ƯỚC CHỢ 2</div>
          <strong style="color: var(--suit-wool); display: inline-flex; align-items: center; gap: 2px;">
            +${myScore.market2Total} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
          </strong>
        </div>
      </div>
    </div>

    <!-- Silver Bonuses Breakdown -->
    ${myScore.silverBreakdown && myScore.silverBreakdown.length > 0 ? `
      <div style="background: #ffffff; border: 1px solid var(--border-delicate); border-radius: var(--radius-md); padding: 10px 12px;">
        <div style="font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
          ${getIcon('star', { size: 13, style: 'vertical-align: -1px;' })} <span>THẺ BẠC CỦA BẠN (+${myScore.silverGold} Điểm):</span>
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: var(--text-secondary);">
          ${myScore.silverBreakdown.map(sb => `
            <li style="margin-bottom: 4px;">
              <strong style="color: var(--text-primary);">${sb.name}</strong>: <span style="color: var(--badge-coin-text); font-weight: 700; display: inline-flex; align-items: center; gap: 2px;">+${sb.points} ${getIcon('star', { size: 11, style: 'vertical-align: -1px;' })}</span> <em>(${sb.reason})</em>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- Leaderboard Comparison -->
    <div>
      <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
        Xếp Hạng Bàn Chơi
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${players.map((p, idx) => {
          const sc = liveScores[p.id] || { projectedFinalScore: p.supply_gold };
          const isMe = p.id === myPlayerId;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: ${isMe ? 'var(--badge-coin-bg)' : '#ffffff'}; border: 1px solid ${isMe ? 'var(--badge-coin-border)' : 'var(--border-delicate)'}; border-radius: 6px; padding: 8px 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; font-size: 12px; color: var(--text-secondary);">${idx === 0 ? getIcon('crown', { size: 13, style: 'vertical-align: -1px;' }) : `#${idx + 1}`}</span>
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${p.color || '#5e8ba3'};"></div>
                <strong style="font-size: 13px; color: var(--text-primary);">${p.name} ${isMe ? '(Bạn)' : ''}</strong>
              </div>
              <span style="font-weight: 800; font-size: 14px; color: var(--badge-coin-text); display: inline-flex; align-items: center; gap: 3px;">
                <span>${sc.projectedFinalScore}</span> ${getIcon('trophy', { size: 13, style: 'vertical-align: -1px;' })}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  mobileScoreModal.classList.add('open');
}

btnPassTurn.addEventListener('click', () => {
  audio.playCardSlideSound();
  audio.triggerHaptic([20]);
  ws.send(JSON.stringify({
    type: 'PLAYER_ACTION',
    action: {
      type: 'pass',
      playerId: myPlayerId
    }
  }));
});

function calculateFood(p) {
  const topFood = p.village
    .filter(c => !p.village.some(child => child.parent_instance_id === c.id))
    .reduce((sum, c) => sum + (c.food || 0), 0);
  return 2 + topFood + (p.founders_flipped_to_food ? 1 : 0);
}

function calculateBuilder(p) {
  const topBuilder = p.village
    .filter(c => !p.village.some(child => child.parent_instance_id === c.id))
    .reduce((sum, c) => sum + (c.builder || 0), 0);
  return 2 + topBuilder;
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${getIcon('sparkles', { size: 16 })} <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

connectWebSocket();
