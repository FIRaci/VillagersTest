import { audio } from './audio.js';
import { getIcon } from './icons.js';

let cardsDatabase = null;

// Load cards data from data/cards.json
async function loadCardsDatabase() {
  if (cardsDatabase) return cardsDatabase;
  try {
    const res = await fetch('/data/cards.json');
    if (res.ok) {
      cardsDatabase = await res.json();
    }
  } catch (err) {
    console.warn('Could not load cards.json for inspector:', err);
  }
  return cardsDatabase || [];
}

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
 * Creates or retrieves the Card Inspector Modal in the DOM
 */
function ensureInspectorModal() {
  let modal = document.getElementById('tts-card-inspector-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'tts-card-inspector-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog inspector-modal" style="position: relative;">
        <button class="modal-close-btn" id="tts-inspector-close-x" style="position: absolute; top: 14px; right: 14px; z-index: 50;">
          ${getIcon('close', { size: 18 })}
        </button>
        
        <!-- Left: Magnified Card Artwork -->
        <div class="inspector-card-preview" id="tts-inspector-img">
          <div id="tts-inspector-img-coins" class="card-coins-cluster" style="display: none; top: 10px; right: 10px;"></div>
        </div>

        <!-- Right: Tabletop Card Specifications & Rules -->
        <div class="inspector-details">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span id="tts-inspector-suit-badge" class="badge-pill" style="font-size: 11px; padding: 2px 8px;"></span>
              <span id="tts-inspector-type-badge" class="badge-pill" style="background: var(--bg-surface-inset); font-size: 11px;"></span>
            </div>
            <h2 id="tts-inspector-name" style="color: var(--text-primary); font-size: 20px; font-weight: 800; letter-spacing: 0.03em; margin: 0;"></h2>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: var(--bg-surface-inset); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Vàng In</div>
              <div id="tts-stat-gold" style="font-size: 16px; font-weight: 800; color: var(--badge-coin-text); display: flex; align-items: center; justify-content: center; gap: 4px;">
                <img src="/assets/icons/gold_coin.svg" style="width: 14px; height: 14px;"> <span>0</span>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Lương thực</div>
              <div id="tts-stat-food" style="font-size: 16px; font-weight: 800; color: var(--badge-food-text); display: flex; align-items: center; justify-content: center; gap: 4px;">
                <img src="/assets/icons/food_token.svg" style="width: 14px; height: 14px;"> <span>0</span>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Thợ xây</div>
              <div id="tts-stat-builder" style="font-size: 16px; font-weight: 800; color: var(--badge-builder-text); display: flex; align-items: center; justify-content: center; gap: 4px;">
                <img src="/assets/icons/builder_token.svg" style="width: 14px; height: 14px;"> <span>0</span>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Vàng Đặt</div>
              <div id="tts-stat-coins" style="font-size: 16px; font-weight: 800; color: var(--badge-coin-text); display: flex; align-items: center; justify-content: center; gap: 4px;">
                <img src="/assets/icons/gold_coin.svg" style="width: 14px; height: 14px;"> <span>0</span>
              </div>
            </div>
          </div>

          <!-- Silver Formula Section (if applicable) -->
          <div id="tts-silver-section" style="display: none; background: #fdfaf7; border: 1.5px solid var(--border-delicate); border-radius: var(--radius-md); padding: 10px 12px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; color: var(--text-primary); font-size: 12px; margin-bottom: 4px;">
              <span>${getIcon('star', { size: 13, style: 'vertical-align: -2px;' })} CÔNG THỨC ĐIỂM BẠC (CHỢ 2)</span>
            </div>
            <div id="tts-silver-desc" style="font-size: 13px; color: var(--text-secondary);"></div>
          </div>

          <!-- Production Chain Breadcrumb -->
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
              Dây Chuyền Sản Xuất (Chain Position)
            </div>
            <div class="chain-breadcrumb" id="tts-inspector-chain"></div>
          </div>

          <!-- Padlock & Key Matrix -->
          <div id="tts-padlock-box" class="padlock-card-box" style="display: none;"></div>

          <!-- Keys It Provides -->
          <div id="tts-keys-provided-box" style="display: none; background: var(--badge-coin-bg); border: 1px solid var(--badge-coin-border); border-radius: var(--radius-md); padding: 8px 12px; font-size: 12px; color: var(--badge-coin-text);">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 2px;">
              ${getIcon('key', { size: 14 })} <span>GIỮ CHÌA KHÓA MỞ:</span>
            </div>
            <div id="tts-keys-provided-list" style="color: var(--text-primary);"></div>
          </div>

          <!-- Rule Clarification / Official Notes -->
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;">
              Giải Thích Luật & Lưu Ý Chính Thức
            </div>
            <p id="tts-inspector-rules" style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin: 0; background: var(--bg-surface-inset); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);"></p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('tts-inspector-close-x').addEventListener('click', closeInspector);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeInspector();
    });

    // Escape key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeInspector();
      }
    });
  }
  return modal;
}

export async function openInspector(card, gameState, activePlayerId) {
  if (!card) return;
  const modal = ensureInspectorModal();
  const db = await loadCardsDatabase();
  const cardData = db.find(c => c.code === card.code) || card;

  audio.playCardSlideSound();

  // Magnified Image
  const imgBox = document.getElementById('tts-inspector-img');
  imgBox.style.backgroundImage = `url('/${card.primary_image || cardData.primary_image}')`;

  const coinsCluster = document.getElementById('tts-inspector-img-coins');
  if (card.coins > 0) {
    coinsCluster.style.display = 'flex';
    coinsCluster.innerHTML = `<img src="/assets/icons/gold_coin.svg" style="width:14px;height:14px;"> <span>+${card.coins}</span>`;
  } else {
    coinsCluster.style.display = 'none';
  }

  // Header badges
  const suitBadge = document.getElementById('tts-inspector-suit-badge');
  const iconPath = `/assets/icons/${suitToIcon(card.suit || cardData.suit)}`;
  suitBadge.innerHTML = `<img src="${iconPath}" style="width:12px;height:12px;margin-right:4px;"> ${card.suit || cardData.suit || 'Base'}`;

  const typeBadge = document.getElementById('tts-inspector-type-badge');
  const placedOn = card.placed_on || (cardData.production_chain && cardData.production_chain.placed_on) || [];
  if (!placedOn || placedOn.length === 0) {
    typeBadge.textContent = card.code === 'Founders' ? 'Khởi Nghiệp (Starter)' : 'Cơ Sở (Base / Starter)';
  } else {
    typeBadge.textContent = `Bậc Nâng Cấp (Cần đặt lên: ${placedOn.join(' hoặc ')})`;
  }

  document.getElementById('tts-inspector-name').textContent = card.name || cardData.name;

  // Stats
  document.querySelector('#tts-stat-gold span').textContent = card.gold ?? cardData.gold ?? 0;
  document.querySelector('#tts-stat-food span').textContent = card.food ?? cardData.food ?? 0;
  document.querySelector('#tts-stat-builder span').textContent = card.builder ?? cardData.builder ?? 0;
  document.querySelector('#tts-stat-coins span').textContent = card.coins ?? 0;

  // Silver Formula
  const silverSection = document.getElementById('tts-silver-section');
  const silverDesc = document.getElementById('tts-silver-desc');
  const silverFormula = card.silver_formula || cardData.silver_formula;
  if (silverFormula) {
    silverSection.style.display = 'block';
    silverDesc.textContent = `${silverFormula} (Tính điểm thưởng tổng kết trong Chợ Lần 2)`;
  } else {
    silverSection.style.display = 'none';
  }

  // Production Chain Breadcrumb
  const chainBox = document.getElementById('tts-inspector-chain');
  chainBox.innerHTML = '';
  const chainList = [];
  if (placedOn && placedOn.length > 0) {
    placedOn.forEach(parentName => {
      chainList.push({ name: parentName, active: false });
    });
  }
  chainList.push({ name: card.name || card.code, active: true });
  const precedes = card.precedes || (cardData.production_chain && cardData.production_chain.precedes) || [];
  if (precedes && precedes.length > 0) {
    precedes.forEach(childName => {
      chainList.push({ name: childName, active: false });
    });
  }

  chainList.forEach((step, idx) => {
    if (idx > 0) {
      const arrow = document.createElement('span');
      arrow.style.color = 'var(--text-muted)';
      arrow.innerHTML = '➔';
      chainBox.appendChild(arrow);
    }
    const span = document.createElement('span');
    span.className = `chain-breadcrumb-step ${step.active ? 'active' : ''}`;
    span.textContent = step.name;
    chainBox.appendChild(span);
  });

  // Padlock Requirement Matrix
  const padlockBox = document.getElementById('tts-padlock-box');
  const unlockedBy = card.unlocked_by || (cardData.padlock && cardData.padlock.unlocked_by);
  const hasPadlock = card.has_padlock || (cardData.padlock && cardData.padlock.has_padlock);

  if (hasPadlock && unlockedBy) {
    padlockBox.style.display = 'flex';
    let keyOwner = null;
    let isSelf = false;

    if (gameState && gameState.players) {
      for (const p of gameState.players) {
        if (p.village && p.village.some(c => c.code === unlockedBy)) {
          keyOwner = p;
          if (p.id === activePlayerId) isSelf = true;
          break;
        }
      }
    }

    if (isSelf) {
      padlockBox.className = 'padlock-card-box unlocked';
      padlockBox.innerHTML = `
        ${getIcon('padlockUnlocked', { size: 22 })}
        <div>
          <strong style="color: #2ecc71;">ĐÃ MỞ KHÓA (CHÌA CHÍNH BẠN SỞ HỮU)!</strong><br>
          Làng bạn đã có <strong>${unlockedBy}</strong>. Được miễn phí đặt và nhận thêm <strong>2 Vàng từ Ngân hàng</strong>!
        </div>
      `;
    } else if (keyOwner) {
      padlockBox.className = 'padlock-card-box locked';
      padlockBox.innerHTML = `
        ${getIcon('padlockLocked', { size: 22 })}
        <div>
          <strong style="color: #e74c3c;">KHÓA BẢN QUYỀN - NGƯỜI CHƠI KHÁC SỞ HỮU!</strong><br>
          Người chơi <strong style="color: ${keyOwner.color || '#e74c3c'};">${keyOwner.name}</strong> đang có <strong>${unlockedBy}</strong>.<br>
          Bạn phải trả <strong>2 Vàng cho ${keyOwner.name}</strong> khi xây lá này!
        </div>
      `;
    } else {
      padlockBox.className = 'padlock-card-box locked';
      padlockBox.innerHTML = `
        ${getIcon('padlockLocked', { size: 22 })}
        <div>
          <strong style="color: #f39c12;">YÊU CẦU CHÌA KHÓA: ${unlockedBy}</strong><br>
          Hiện chưa có người chơi nào sở hữu chìa khóa. Bạn phải trả <strong>2 Vàng cho Ngân hàng</strong> khi xây lá này!
        </div>
      `;
    }
  } else {
    padlockBox.style.display = 'none';
  }

  // Keys it provides
  const keysProvidedBox = document.getElementById('tts-keys-provided-box');
  const keysProvidedList = document.getElementById('tts-keys-provided-list');
  const unlocks = card.unlocks || (cardData.padlock && cardData.padlock.unlocks) || [];
  if (unlocks && unlocks.length > 0) {
    keysProvidedBox.style.display = 'block';
    keysProvidedList.textContent = `Lá này mở khóa cho: ${unlocks.join(', ')}. Bất kỳ người chơi nào xây các lá trên sẽ phải trả 2 Vàng cho bạn!`;
  } else {
    keysProvidedBox.style.display = 'none';
  }

  // Rules & Clarifications
  const rulesP = document.getElementById('tts-inspector-rules');
  const desc = cardData.description || '';
  const clar = cardData.clarification || '';
  rulesP.textContent = (desc + (clar ? '\n\nLưu ý: ' + clar : '')) || 'Không có lưu ý đặc biệt cho thẻ này.';

  modal.classList.add('open');
}

export function closeInspector() {
  const modal = document.getElementById('tts-card-inspector-modal');
  if (modal) {
    modal.classList.remove('open');
    audio.playButtonClick();
  }
}
