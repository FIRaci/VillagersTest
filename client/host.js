import { audio } from './audio.js';
import { getIcon } from './icons.js';
import { openInspector } from './inspector.js';
import { renderVillageChains } from './chain_tree.js';
import { openControlPanel, renderControlPanelContent } from './host_control_panel.js';

let ws = null;
let currentGameState = null;
let networkInfo = null;

const roadGrid = document.getElementById('road-grid');
const playersGrid = document.getElementById('players-grid');
const phaseBadge = document.getElementById('phase-badge');
const roundBadge = document.getElementById('round-badge');
const serverUrlText = document.getElementById('server-url');
const rewindSlider = document.getElementById('rewind-slider');
const stepLabel = document.getElementById('step-label');

const btnOpenControlPanel = document.getElementById('btn-open-control-panel');
const btnShowQr = document.getElementById('btn-show-qr');
const btnExportLog = document.getElementById('btn-export-log');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnShuffle = document.getElementById('btn-shuffle');
const btnDeal = document.getElementById('btn-deal');
const btnAdjustGold = document.getElementById('btn-adjust-gold');
const btnForcePhase = document.getElementById('btn-force-phase');
const roadHeaderIcon = document.getElementById('road-header-icon');
const btnCloseQr = document.getElementById('btn-close-qr');
const btnCloseQrX = document.getElementById('btn-close-qr-x');
const btnCloseGoldModal = document.getElementById('btn-close-gold-modal');
const btnCloseGoldModalX = document.getElementById('btn-close-gold-modal-x');
const btnConfirmGold = document.getElementById('btn-confirm-gold');
const btnCopyUrl = document.getElementById('btn-copy-url');

const qrModal = document.getElementById('qr-modal');
const adjustGoldModal = document.getElementById('adjust-gold-modal');
const inputGoldDelta = document.getElementById('input-gold-delta');

export function sendTabletopAction(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// Initialize vector SVG icons into buttons
function initHostIcons() {
  if (btnOpenControlPanel) {
    btnOpenControlPanel.innerHTML = `${getIcon('crown', { size: 16 })} <span>Bảng Trọng Tài</span>`;
    btnOpenControlPanel.addEventListener('click', () => {
      if (currentGameState) openControlPanel(currentGameState, sendTabletopAction);
    });
  }
  btnShowQr.innerHTML = `${getIcon('qr', { size: 16 })} <span>Quét QR Di Động</span>`;
  btnExportLog.innerHTML = `${getIcon('copy', { size: 16 })} <span>Xuất Log</span>`;
  btnUndo.innerHTML = `${getIcon('undo', { size: 16 })} <span>Undo</span>`;
  btnRedo.innerHTML = `${getIcon('redo', { size: 16 })} <span>Redo</span>`;
  btnShuffle.innerHTML = `${getIcon('shuffle', { size: 16 })} <span>Tráo bài</span>`;
  btnDeal.innerHTML = `${getIcon('deal', { size: 16 })} <span>Chia bài</span>`;
  btnAdjustGold.innerHTML = `${getIcon('goldAdjust', { size: 16 })} <span>Chỉnh Vàng</span>`;
  btnForcePhase.innerHTML = `${getIcon('forcePhase', { size: 16 })} <span>Ép Đổi Phase</span>`;
  roadHeaderIcon.innerHTML = getIcon('road', { size: 20 });
  btnCloseQrX.innerHTML = getIcon('close', { size: 16 });
  btnCloseGoldModalX.innerHTML = getIcon('close', { size: 16 });
  btnCopyUrl.innerHTML = getIcon('copy', { size: 14 });

  // Quick delta buttons
  document.getElementById('btn-delta-m2').addEventListener('click', () => { inputGoldDelta.value = -2; });
  document.getElementById('btn-delta-m1').addEventListener('click', () => { inputGoldDelta.value = -1; });
  document.getElementById('btn-delta-p1').addEventListener('click', () => { inputGoldDelta.value = 1; });
  document.getElementById('btn-delta-p2').addEventListener('click', () => { inputGoldDelta.value = 2; });
}
initHostIcons();

// Tabletop Theme Toggle (Default to clean white studio table)
const btnHostThemeToggle = document.getElementById('btn-host-theme-toggle');
const hostThemeIcon = document.getElementById('host-theme-icon');
const hostThemeText = document.getElementById('host-theme-text');

function applyHostTheme(theme) {
  if (theme === 'white') {
    document.body.classList.add('theme-white');
    if (hostThemeIcon) hostThemeIcon.innerHTML = getIcon('themeWood', { size: 14 });
    if (hostThemeText) hostThemeText.textContent = 'BÀN GỖ';
  } else {
    document.body.classList.remove('theme-white');
    if (hostThemeIcon) hostThemeIcon.innerHTML = getIcon('themeWhite', { size: 14 });
    if (hostThemeText) hostThemeText.textContent = 'BÀN TRẮNG';
  }
  localStorage.setItem('villagers_table_theme', theme);
}

const savedHostTheme = localStorage.getItem('villagers_table_theme') || 'white';
applyHostTheme(savedHostTheme);

if (btnHostThemeToggle) {
  btnHostThemeToggle.addEventListener('click', () => {
    const isWhite = document.body.classList.contains('theme-white');
    applyHostTheme(isWhite ? 'wood' : 'white');
    audio.playButtonClick();
  });
}

// Fetch network info & QR code
async function loadNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    networkInfo = await res.json();
    serverUrlText.textContent = networkInfo.url;
    document.getElementById('qr-image').src = networkInfo.qrCodeDataUrl;
    document.getElementById('qr-url-text').textContent = networkInfo.url;
  } catch (err) {
    console.error('Failed to load network info:', err);
  }
}

// Copy URL to clipboard
btnCopyUrl.addEventListener('click', () => {
  if (networkInfo && networkInfo.url) {
    navigator.clipboard.writeText(networkInfo.url).then(() => {
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
      audio.triggerHaptic([20]);
    });
  }
});

// WebSocket Connection
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Host connected to server via WebSocket');
    ws.send(JSON.stringify({ type: 'HOST_CONNECT' }));
    showToast('Máy chủ Host đã sẵn sàng!');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'GAME_STATE') {
        currentGameState = data.state;
        renderGameState(currentGameState);
        const panelModal = document.getElementById('host-control-panel-modal');
        if (panelModal && panelModal.classList.contains('open')) {
          renderControlPanelContent(currentGameState, sendTabletopAction);
        }
      } else if (data.type === 'TOAST') {
        showToast(data.message);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  };

  ws.onclose = () => {
    console.warn('WebSocket closed. Reconnecting in 2s...');
    setTimeout(connectWebSocket, 2000);
  };
}

// Render Board
function renderGameState(state) {
  // Update phase & round
  const phaseType = state.phase ? state.phase.type : 'draft';
  if (phaseType === 'ended') {
    phaseBadge.textContent = 'CHUNG CUỘC - KẾT THÚC';
    phaseBadge.style.background = '#fdf6e7';
    phaseBadge.style.borderColor = '#dfc282';
    phaseBadge.style.color = '#7a5a14';
    renderHostGameOver(state);
  } else {
    hostGameOverDismissed = false;
    const govModal = document.getElementById('host-game-over-modal');
    if (govModal) govModal.classList.remove('open');
    
    if (phaseType === 'first_market') {
      phaseBadge.textContent = 'CHỢ LẦN 1 (TÍNH ĐIỂM)';
    } else if (phaseType === 'second_market') {
      phaseBadge.textContent = 'CHỢ LẦN 2 (CHUNG CUỘC)';
    } else {
      phaseBadge.textContent = phaseType.toUpperCase() + ' PHASE';
      phaseBadge.style.background = '';
      phaseBadge.style.borderColor = '';
      phaseBadge.style.color = '';
    }
  }
  roundBadge.textContent = `Vòng: ${state.round}`;
  
  // Update timeline slider
  rewindSlider.max = state.step;
  rewindSlider.value = state.step;
  stepLabel.textContent = `Bước ${state.step}`;

  // Update Bank & Reserve
  document.getElementById('bank-gold').innerHTML = `
    <img src="/assets/icons/gold_coin.svg" class="token-icon" alt="Gold">
    <span>Ngân hàng: ${state.bank_gold || 120}</span>
  `;
  document.getElementById('reserve-count').innerHTML = `
    ${getIcon('deck', { size: 14 })}
    <span>Dự trữ: ${state.reserve_count || 0} lá</span>
  `;

  // Render Road: 6 Recessed Wells (Roman Numerals I - VI)
  roadGrid.innerHTML = '';
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

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

  for (let i = 0; i < 6; i++) {
    const stack = state.road.stacks[i] || [];
    const faceUpCard = state.road.face_up[i];

    const wellDiv = document.createElement('div');
    wellDiv.className = 'road-well';

    // Top: Roman Numeral Label
    const romanLabel = document.createElement('div');
    romanLabel.className = 'well-roman-badge';
    romanLabel.textContent = `CỌC ${romanNumerals[i]}`;
    wellDiv.appendChild(romanLabel);

    // Middle: 3D Stack Card Extrusion with Suit Card Back
    const stackDiv = document.createElement('div');
    stackDiv.className = 'deck-stack-card';
    
    if (stack.length > 0) {
      const topCard = stack[0];
      const suitKey = (topCard.suit || 'default').toLowerCase();
      const meta = SUIT_META[suitKey] || SUIT_META.default;
      
      stackDiv.style.backgroundImage = `url('/assets/backs/back_${suitKey}.svg')`;
      stackDiv.style.borderColor = meta.color;
      stackDiv.title = `Cọc ${romanNumerals[i]}: Đỉnh cọc là hệ ${meta.name} (${meta.en}) - Còn ${stack.length} lá`;

      stackDiv.innerHTML = `
        <div class="deck-count-badge">${stack.length} lá</div>
        ${i === 1 ? '<div class="market-flag">Chợ Lần 1</div>' : ''}
        ${i === 5 ? '<div class="market-flag">Chợ Lần 2</div>' : ''}
      `;
    } else {
      stackDiv.classList.add('deck-stack-empty');
      stackDiv.style.backgroundImage = 'none';
      stackDiv.innerHTML = `
        <div class="deck-empty-label">HẾT BÀI</div>
        ${i === 1 ? '<div class="market-flag market-flag-exhausted">Hết (Chợ 1 Đã Mở)</div>' : ''}
        ${i === 5 ? '<div class="market-flag market-flag-exhausted">Hết (Chợ 2 Đã Mở)</div>' : ''}
      `;
    }
    wellDiv.appendChild(stackDiv);

    // Bottom: Face-up Card in Market
    if (faceUpCard) {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'villager-card';
      cardDiv.style.backgroundImage = `url('/${faceUpCard.primary_image}')`;
      cardDiv.title = `${faceUpCard.name} (${faceUpCard.suit}) - Nhấp để soi thẻ bài`;
      cardDiv.style.cursor = 'pointer';
      cardDiv.addEventListener('click', () => {
        openInspector(faceUpCard, state, null);
      });

      if (faceUpCard.coins > 0) {
        const coinBadge = document.createElement('div');
        coinBadge.className = 'card-coins-cluster';
        coinBadge.innerHTML = `
          <img src="/assets/icons/gold_coin.svg" alt="Gold">
          <span>+${faceUpCard.coins}</span>
        `;
        cardDiv.appendChild(coinBadge);
      }
      wellDiv.appendChild(cardDiv);
    } else {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'card-slot-empty';
      emptyDiv.textContent = 'Trống';
      wellDiv.appendChild(emptyDiv);
    }

    roadGrid.appendChild(wellDiv);
  }

  // Render Players
  playersGrid.innerHTML = '';
  const selectPlayer = document.getElementById('select-gold-player');
  selectPlayer.innerHTML = '';

  state.players.forEach((p, idx) => {
    // Add to dropdown
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    selectPlayer.appendChild(opt);

    const pCard = document.createElement('div');
    pCard.className = 'player-card';
    pCard.style.borderTop = `4px solid ${p.color || '#d4af37'}`;

    const isFirst = state.first_player_id === p.id || state.first_player_index === idx;
    const liveSc = state.live_scores ? state.live_scores[p.id] : null;
    const projectedTotal = liveSc ? liveSc.projectedFinalScore : p.supply_gold;

    // Header with luxury game tokens & live scores
    pCard.innerHTML = `
      <div class="player-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${p.is_connected ? 'var(--suit-wood)' : '#a84242'};"></div>
          <strong style="font-size: 15px; color: var(--text-primary); letter-spacing: 0.03em;">${p.name}</strong>
          ${isFirst ? `<img src="/assets/icons/firstplayer.png" class="token-meeple" title="Người chơi đầu (First Player)">` : ''}
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <span class="badge-coin tabular-nums" title="Vàng trong kho">
            <img src="/assets/icons/gold_coin.svg" class="token-icon"> <span>${p.supply_gold}</span>
          </span>
          <span class="badge-food tabular-nums" title="Giới hạn Lương thực">
            <img src="/assets/icons/food_token.svg" class="token-icon"> <span>${calculateFood(p)}</span>
          </span>
          <span class="badge-builder tabular-nums" title="Giới hạn Thợ xây">
            <img src="/assets/icons/builder_token.svg" class="token-icon"> <span>${calculateBuilder(p)}</span>
          </span>
          <span class="badge-pill tabular-nums" style="background: var(--badge-coin-bg); border: 1px solid var(--badge-coin-border); color: var(--badge-coin-text); font-weight: 700; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" title="Điểm ước tính toàn diện - Bấm để mở Bảng Trọng Tài" onclick="window.__openHostControlPanel()">
            ${getIcon('trophy', { size: 12, style: 'vertical-align: -1px;' })} <span>${projectedTotal} điểm</span>
          </span>
          <span class="badge-pill tabular-nums" style="background: var(--bg-surface-inset); border: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 11.5px;">
            ${getIcon('deck', { size: 13 })} <span>${p.hand.length} lá</span>
          </span>
        </div>
      </div>
      <div class="village-container" id="player-village-${p.id}"></div>
    `;

    playersGrid.appendChild(pCard);

    // Render Branching Tree in Village
    const vContainer = document.getElementById(`player-village-${p.id}`);
    renderVillageChains(vContainer, p.village, {
      gameState: state,
      activePlayerId: p.id
    });
  });
}

window.__openHostControlPanel = () => {
  if (currentGameState) openControlPanel(currentGameState, sendTabletopAction);
};

// Audio Toggle
const btnSfxToggle = document.getElementById('btn-sfx-toggle');
const sfxIcon = document.getElementById('sfx-icon');
if (btnSfxToggle && sfxIcon) {
  sfxIcon.src = audio.isMuted ? '/assets/icons/sound_off.svg' : '/assets/icons/sound_on.svg';
  btnSfxToggle.addEventListener('click', () => {
    const isUnmuted = audio.toggleMute();
    sfxIcon.src = isUnmuted ? '/assets/icons/sound_on.svg' : '/assets/icons/sound_off.svg';
    showToast(isUnmuted ? 'Đã bật âm thanh trò chơi' : 'Đã tắt âm thanh trò chơi');
  });
}

// Tabletop Controls
btnUndo.addEventListener('click', () => {
  audio.playCardSlideSound();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'undo' } }));
});

btnRedo.addEventListener('click', () => {
  audio.playCardSlideSound();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'redo' } }));
});

rewindSlider.addEventListener('change', (e) => {
  const targetStep = parseInt(e.target.value, 10);
  audio.playCardSlideSound();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'rewind_to', step: targetStep } }));
});

btnShuffle.addEventListener('click', () => {
  audio.playShuffleSound();
  const seed = Date.now();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'shuffle', seed: seed } }));
  showToast(`Đã tráo ngẫu nhiên bộ bài (Hạt giống: ${seed})`);
});

btnDeal.addEventListener('click', () => {
  audio.playShuffleSound();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'deal', countPerPlayer: 5 } }));
  showToast('Đã chia 5 lá bài cho mỗi người chơi!');
});

btnAdjustGold.addEventListener('click', () => {
  audio.playButtonClick();
  adjustGoldModal.classList.add('open');
});

btnCloseGoldModal.addEventListener('click', () => adjustGoldModal.classList.remove('open'));
btnCloseGoldModalX.addEventListener('click', () => adjustGoldModal.classList.remove('open'));

btnConfirmGold.addEventListener('click', () => {
  const playerId = document.getElementById('select-gold-player').value;
  const delta = parseInt(document.getElementById('input-gold-delta').value, 10) || 0;

  audio.playCoinSound();
  ws.send(JSON.stringify({
    type: 'TABLETOP_ACTION',
    action: {
      type: 'adjust_gold',
      playerId: playerId,
      delta: delta
    }
  }));
  adjustGoldModal.classList.remove('open');
  showToast(`Đã cập nhật ${delta > 0 ? '+' : ''}${delta} Vàng cho người chơi!`);
});

btnForcePhase.addEventListener('click', () => {
  audio.playPhaseBell();
  ws.send(JSON.stringify({ type: 'TABLETOP_ACTION', action: { type: 'force_phase' } }));
  showToast('Đã chuyển sang Phase tiếp theo!');
});

btnShowQr.addEventListener('click', () => {
  qrModal.classList.add('open');
});

btnCloseQr.addEventListener('click', () => qrModal.classList.remove('open'));
btnCloseQrX.addEventListener('click', () => qrModal.classList.remove('open'));

btnExportLog.addEventListener('click', () => {
  if (currentGameState) {
    const blob = new Blob([JSON.stringify(currentGameState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `villagers_state_step_${currentGameState.step}.json`;
    a.click();
    showToast('Đã xuất file log trạng thái ván cờ!');
  }
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

let hostGameOverDismissed = false;

function renderHostGameOver(state) {
  const modal = document.getElementById('host-game-over-modal');
  if (!modal || hostGameOverDismissed) return;

  const spotlight = document.getElementById('host-winner-spotlight');
  const leaderboard = document.getElementById('host-leaderboard-container');
  const btnClose = document.getElementById('btn-close-host-game-over');
  const btnReset = document.getElementById('btn-host-reset-play-again');

  const players = [...state.players].sort((a, b) => {
    if (b.supply_gold !== a.supply_gold) return b.supply_gold - a.supply_gold;
    return (b.village ? b.village.length : 0) - (a.village ? a.village.length : 0);
  });

  const winnerId = (state.phase && state.phase.winner_id) || (players[0] && players[0].id);
  const winner = players.find(p => p.id === winnerId) || players[0];

  if (spotlight && winner) {
    spotlight.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: ${winner.color || '#3498db'}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 18px; box-shadow: var(--shadow-sm);">
            ${winner.name ? winner.name.charAt(0) : 'P'}
          </div>
          <div style="text-align: left;">
            <div style="font-size: 12px; font-weight: 800; color: #7a5a14; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
              ${getIcon('crown', { size: 16 })} <span>QUÁN QUÂN VÁN ĐẤU</span>
            </div>
            <div style="font-size: 20px; font-weight: 900; color: var(--text-primary); margin-top: 2px;">${winner.name}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; background: #fdf6e7; border: 1.5px solid #dfc282; border-radius: 24px; padding: 6px 16px;">
          <img src="/assets/icons/gold_coin.svg" style="width: 22px; height: 22px;" alt="Gold">
          <span style="font-size: 22px; font-weight: 900; color: #7a5a14;">${winner.supply_gold} VÀNG</span>
        </div>
      </div>
      <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 10px; background: #faf8f5; border-radius: 6px; padding: 8px 14px; display: flex; justify-content: space-between;">
        <span>Quy mô làng chiến thắng: <strong>${winner.village ? winner.village.length : 0} cư dân định cư</strong></span>
        <span>Số thẻ trên tay: <strong>${winner.hand ? winner.hand.length : 0} lá</strong></span>
      </div>
    `;
  }

  if (leaderboard) {
    leaderboard.innerHTML = `
      <div style="font-size: 11px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.04em;">
        BẢNG TỔNG SẮP THỨ HẠNG TOÀN BÀN
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${players.map((p, idx) => {
          const isWinner = idx === 0;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: ${isWinner ? '#fdf6e7' : '#ffffff'}; border: 1.5px solid ${isWinner ? '#dfc282' : 'var(--border-delicate)'}; border-radius: var(--radius-md); padding: 10px 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 800; font-size: 14px; color: ${isWinner ? '#b58d3d' : 'var(--text-secondary)'}; width: 24px; text-align: center;">
                  ${isWinner ? getIcon('trophy', { size: 16, style: 'vertical-align: -2px;' }) : `#${idx + 1}`}
                </span>
                <div style="width: 14px; height: 14px; border-radius: 50%; background: ${p.color || '#5e8ba3'};"></div>
                <div>
                  <strong style="font-size: 14px; color: var(--text-primary);">${p.name}</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">${p.village ? p.village.length : 0} dân làng trong khu định cư</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <img src="/assets/icons/gold_coin.svg" style="width: 16px; height: 16px;" alt="Gold">
                <span style="font-weight: 900; font-size: 17px; color: ${isWinner ? '#7a5a14' : 'var(--text-primary)'};">${p.supply_gold}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (btnClose && !btnClose.__bound) {
    btnClose.__bound = true;
    btnClose.addEventListener('click', () => {
      hostGameOverDismissed = true;
      modal.classList.remove('open');
      audio.playButtonClick();
    });
  }

  if (btnReset && !btnReset.__bound) {
    btnReset.__bound = true;
    btnReset.addEventListener('click', () => {
      audio.playShuffleSound();
      sendTabletopAction({ type: 'TABLETOP_ACTION', action: { type: 'reset_game' } });
      hostGameOverDismissed = false;
      modal.classList.remove('open');
      showToast('Đã bắt đầu ván chơi mới!');
    });
  }

  modal.classList.add('open');
}

loadNetworkInfo();
connectWebSocket();
