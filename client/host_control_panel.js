import { audio } from './audio.js';
import { getIcon } from './icons.js';
import { openInspector } from './inspector.js';

let activeTab = 'scoreboard';

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

/**
 * Ensures the Host Control Panel modal exists in DOM
 */
export function ensureControlPanelModal(onAction) {
  let modal = document.getElementById('host-control-panel-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'host-control-panel-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog" style="max-width: 860px; width: 95%; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-delicate); padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${getIcon('crown', { size: 20 })}
            <h2 style="color: var(--text-primary); font-size: 18px; font-weight: 800; margin: 0; letter-spacing: 0.03em;">
              BẢNG ĐIỀU KHIỂN TRỌNG TÀI TABLETOP
            </h2>
          </div>
          <button class="modal-close-btn" id="btn-close-control-panel-x">
            ${getIcon('close', { size: 18 })}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="control-tabs">
          <button class="control-tab-btn active" data-tab="scoreboard">
            ${getIcon('crown', { size: 15 })} <span>Bảng Điểm Trực Tiếp</span>
          </button>
          <button class="control-tab-btn" data-tab="players">
            ${getIcon('opponents', { size: 15 })} <span>Quản Lý Người Chơi</span>
          </button>
          <button class="control-tab-btn" data-tab="decks">
            ${getIcon('deck', { size: 15 })} <span>Kho Bài & Đống Bài Bỏ</span>
          </button>
          <button class="control-tab-btn" data-tab="timemachine">
            ${getIcon('undo', { size: 15 })} <span>Cỗ Máy Thời Gian & Phase</span>
          </button>
        </div>

        <!-- Tab Contents -->
        <div id="control-panel-body" style="flex: 1; overflow-y: auto; padding-right: 4px;">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-control-panel-x').addEventListener('click', closeControlPanel);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeControlPanel();
    });

    // Tab buttons
    modal.querySelectorAll('.control-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.control-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        audio.playButtonClick();
        if (window.__currentHostState) {
          renderControlPanelContent(window.__currentHostState, onAction);
        }
      });
    });
  }
  return modal;
}

export function openControlPanel(gameState, onAction) {
  window.__currentHostState = gameState;
  const modal = ensureControlPanelModal(onAction);
  renderControlPanelContent(gameState, onAction);
  modal.classList.add('open');
  audio.playButtonClick();
}

export function closeControlPanel() {
  const modal = document.getElementById('host-control-panel-modal');
  if (modal) {
    modal.classList.remove('open');
    audio.playButtonClick();
  }
}

export function renderControlPanelContent(gameState, onAction) {
  const body = document.getElementById('control-panel-body');
  if (!body || !gameState) return;

  if (activeTab === 'scoreboard') {
    renderScoreboardTab(body, gameState);
  } else if (activeTab === 'players') {
    renderPlayersTab(body, gameState, onAction);
  } else if (activeTab === 'decks') {
    renderDecksTab(body, gameState);
  } else if (activeTab === 'timemachine') {
    renderTimeMachineTab(body, gameState, onAction);
  }
}

function renderScoreboardTab(body, gameState) {
  const liveScores = gameState.live_scores || {};
  const players = [...(gameState.players || [])];

  // Sort by projectedFinalScore descending
  players.sort((a, b) => {
    const scoreA = liveScores[a.id]?.projectedFinalScore ?? a.supply_gold;
    const scoreB = liveScores[b.id]?.projectedFinalScore ?? b.supply_gold;
    return scoreB - scoreA;
  });

  body.innerHTML = `
    <div style="background: #ffffff; border-radius: var(--radius-md); border: 1.5px solid var(--border-delicate); overflow: hidden; margin-bottom: 16px;">
      <table class="score-table">
        <thead>
          <tr>
            <th style="width: 48px;">Hạng</th>
            <th>Người Chơi</th>
            <th style="text-align: right;">Tiền Mặt</th>
            <th style="text-align: right;">Ước Chợ 1</th>
            <th style="text-align: right;">Ước Chợ 2</th>
            <th style="text-align: right;">Điểm Bạc</th>
            <th style="text-align: right; color: var(--text-primary);">Tổng Dự Kiến</th>
          </tr>
        </thead>
        <tbody>
          ${players.map((p, idx) => {
            const sc = liveScores[p.id] || {
              supplyGold: p.supply_gold,
              market1Total: p.supply_gold,
              market2Total: p.supply_gold,
              silverGold: 0,
              silverBreakdown: [],
              projectedFinalScore: p.supply_gold
            };
            const isWinner = idx === 0;
            return `
              <tr style="${isWinner ? 'background: var(--badge-coin-bg); font-weight: 700;' : ''}">
                <td style="font-size: 14px;">
                  ${isWinner ? `${getIcon('crown', { size: 14, style: 'vertical-align: -1px;' })} #1` : `#${idx + 1}`}
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${p.color || '#5e8ba3'};"></div>
                    <span style="font-size: 13.5px; color: var(--text-primary); font-weight: 600;">${p.name}</span>
                  </div>
                </td>
                <td style="text-align: right; color: var(--badge-coin-text); font-weight: 700;">
                  ${sc.supplyGold} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
                </td>
                <td style="text-align: right; color: var(--badge-food-text);">
                  +${sc.market1Total} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
                </td>
                <td style="text-align: right; color: var(--suit-wool);">
                  +${sc.market2Total} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">
                </td>
                <td style="text-align: right; color: var(--badge-builder-text);">
                  ${sc.silverGold > 0 ? `+${sc.silverGold} ${getIcon('star', { size: 11, style: 'vertical-align: -1px;' })}` : `0 ${getIcon('star', { size: 11, style: 'vertical-align: -1px;' })}`}
                </td>
                <td style="text-align: right; font-size: 15px; font-weight: 800; color: var(--badge-coin-text);">
                  ${sc.projectedFinalScore} ${getIcon('trophy', { size: 13, style: 'vertical-align: -1px;' })}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Silver Breakdown Detail Cards -->
    <h4 style="color: var(--text-primary); font-size: 13.5px; margin-bottom: 10px;">CHI TIẾT ĐIỂM THẺ BẠC TỪNG NGƯỜI CHƠI</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
      ${players.map(p => {
        const sc = liveScores[p.id] || {};
        const list = sc.silverBreakdown || [];
        return `
          <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
              <strong style="color: ${p.color || 'var(--text-primary)'}; font-size: 13px;">${p.name}</strong>
              <span style="color: var(--badge-coin-text); font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 3px;">Tổng bạc: +${sc.silverGold || 0} ${getIcon('star', { size: 11, style: 'vertical-align: -1px;' })}</span>
            </div>
            ${list.length === 0 ? `<div style="color: var(--text-muted); font-size: 12px;">Chưa có thẻ Bạc nào</div>` : `
              <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: var(--text-secondary);">
                ${list.map(item => `
                  <li style="margin-bottom: 4px;">
                    <strong style="color: var(--text-primary);">${item.name}</strong>: 
                    <span style="color: var(--badge-coin-text); font-weight: 700; display: inline-flex; align-items: center; gap: 2px;">+${item.points} ${getIcon('star', { size: 10, style: 'vertical-align: -1px;' })}</span> 
                    <em>(${item.reason})</em>
                  </li>
                `).join('')}
              </ul>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPlayersTab(body, gameState, onAction) {
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${gameState.players.map(p => `
        <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-left: 4px solid ${p.color || '#5e8ba3'}; border-radius: var(--radius-md); padding: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${p.is_connected ? 'var(--suit-wood)' : '#a84242'};"></div>
              <strong style="font-size: 15px; color: var(--text-primary);">${p.name}</strong>
              <span style="font-size: 11px; color: var(--text-secondary);">${p.is_connected ? 'Đang kết nối' : 'Mất kết nối'}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 12px;">
              <span>Vàng hiện tại: <strong style="color: var(--badge-coin-text); display: inline-flex; align-items: center; gap: 2px;">${p.supply_gold} <img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng"></strong></span>
              <span>Bài trên tay: <strong>${p.hand.length} lá</strong></span>
              <span>Dân làng: <strong>${p.village.length} lá</strong></span>
            </div>
          </div>

          <!-- Quick Gold Adjust Buttons -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: var(--text-muted); margin-right: 4px;">Can thiệp Vàng:</span>
            <button class="btn btn-sm" onclick="window.__adjustPlayerGold('${p.id}', -2)">-2</button>
            <button class="btn btn-sm" onclick="window.__adjustPlayerGold('${p.id}', -1)">-1</button>
            <button class="btn btn-sm" onclick="window.__adjustPlayerGold('${p.id}', 1)">+1</button>
            <button class="btn btn-sm" onclick="window.__adjustPlayerGold('${p.id}', 2)">+2</button>
            <button class="btn btn-sm" onclick="window.__adjustPlayerGold('${p.id}', 5)">+5</button>
          </div>
        </div>
      `).join('')}

      <div style="border-top: 1px solid var(--border-delicate); padding-top: 14px; margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-danger" id="btn-panel-reset-game">
          ${getIcon('shuffle', { size: 14 })} <span>Khởi Động Lại Toàn Bộ Ván Đấu</span>
        </button>
      </div>
    </div>
  `;

  window.__adjustPlayerGold = (playerId, delta) => {
    audio.playCoinSound();
    if (onAction) {
      onAction({
        type: 'TABLETOP_ACTION',
        action: {
          type: 'adjust_gold',
          playerId: playerId,
          delta: delta
        }
      });
    }
  };

  const btnReset = document.getElementById('btn-panel-reset-game');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn thiết lập lại toàn bộ ván đấu về trạng thái ban đầu?')) {
        audio.playShuffleSound();
        if (onAction) {
          onAction({
            type: 'TABLETOP_ACTION',
            action: { type: 'reset_game' }
          });
        }
        closeControlPanel();
      }
    });
  }
}

function renderDecksTab(body, gameState) {
  const road = gameState.road || [];
  const discard = gameState.discard || [];

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- 6 Road Slots Summary -->
      <div>
        <h4 style="color: var(--text-primary); font-size: 13.5px; margin-bottom: 10px;">TÌNH TRẠNG 6 CHỒNG BÀI DỰ TRỮ (ROAD STACKS)</h4>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
          ${[0, 1, 2, 3, 4, 5].map(i => {
            const stack = road[i] ? road[i][0] : [];
            const faceUp = road[i] ? road[i][1] : null;
            const count = stack ? (stack.length || (stack.toArray ? stack.toArray().length : 0)) : 0;
            return `
              <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 10px; text-align: center;">
                <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; margin-bottom: 4px;">CỌC ${i + 1}</div>
                <div style="font-size: 17px; font-weight: 800; color: var(--text-primary);">${count} lá</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">
                  ${faceUp ? `Mặt ngửa: <span style="color: var(--text-primary); font-weight: 600;">${faceUp.name}</span>` : 'Mặt ngửa: Trống'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Discard Pile -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="color: var(--text-primary); font-size: 13.5px; margin: 0;">ĐỐNG BÀI BỎ (DISCARD PILE - ${discard.length} LÁ)</h4>
        </div>
        ${discard.length === 0 ? `
          <div style="color: var(--text-muted); font-size: 12.5px; padding: 20px; text-align: center; border: 1.5px dashed var(--border-delicate); border-radius: 8px; background: #ffffff;">
            Đống bài bỏ hiện đang trống.
          </div>
        ` : `
          <div style="display: flex; gap: 10px; overflow-x: auto; padding: 6px 0;">
            ${discard.map(c => `
              <div class="villager-card" style="width: 76px; height: 116px; background-image: url('/${c.primary_image}'); flex-shrink: 0; cursor: pointer;" onclick="window.__inspectCard('${c.id}')" title="${c.name}"></div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  window.__inspectCard = (cardId) => {
    const card = discard.find(c => c.id === cardId);
    if (card) openInspector(card, gameState, null);
  };
}

function renderTimeMachineTab(body, gameState, onAction) {
  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <!-- Step Rewind & Fast Forward -->
      <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 14px;">
        <h4 style="color: var(--text-primary); font-size: 13.5px; margin-bottom: 6px;">TUA LẠI NƯỚC ĐI (REWIND ENGINE)</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
          Bạn có thể tua lại bất kỳ bước nào trong lịch sử. Hệ thống Game State của Gleam sẽ hoàn tác trạng thái bài và số vàng 100% chuẩn xác.
        </p>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn" id="btn-panel-undo">${getIcon('undo', { size: 14 })} Hoàn tác (Undo)</button>
          <button class="btn" id="btn-panel-redo">${getIcon('redo', { size: 14 })} Đi tiếp (Redo)</button>
          <span style="font-size: 12.5px; color: var(--text-secondary); font-weight: 700;">Bước hiện tại: ${gameState.step || 0}</span>
        </div>
      </div>

      <!-- Phase Force Switching -->
      <div style="background: #ffffff; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 14px;">
        <h4 style="color: var(--text-primary); font-size: 13.5px; margin-bottom: 6px;">ÉP CHUYỂN GIAI ĐOẠN (FORCE PHASE)</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
          Dành cho trọng tài giải quyết trường hợp người chơi bị treo hoặc muốn chuyển nhanh giữa các giai đoạn:
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn" onclick="window.__forcePhase('draft')">Chuyển sang Nháp Bài (Draft)</button>
          <button class="btn" onclick="window.__forcePhase('build')">Chuyển sang Xây Dựng (Build)</button>
          <button class="btn" onclick="window.__forcePhase('market1')">Kích hoạt Chợ Lần 1</button>
          <button class="btn" onclick="window.__forcePhase('market2')">Kích hoạt Chợ Lần 2 (Chung Cuộc)</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-panel-undo').addEventListener('click', () => {
    audio.playCardSlideSound();
    if (onAction) onAction({ type: 'TABLETOP_ACTION', action: { type: 'undo' } });
  });

  document.getElementById('btn-panel-redo').addEventListener('click', () => {
    audio.playCardSlideSound();
    if (onAction) onAction({ type: 'TABLETOP_ACTION', action: { type: 'redo' } });
  });

  window.__forcePhase = (phaseName) => {
    if (confirm(`Bạn có chắc muốn ép chuyển sang giai đoạn "${phaseName}"?`)) {
      audio.playPhaseBell();
      if (onAction) {
        onAction({
          type: 'TABLETOP_ACTION',
          action: { type: 'force_phase', phase: phaseName }
        });
      }
    }
  };
}
