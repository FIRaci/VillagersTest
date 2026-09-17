import { audio } from './audio.js';
import { getIcon } from './icons.js';

let cardsDatabase = null;

async function getCardsDb() {
  if (cardsDatabase) return cardsDatabase;
  try {
    const res = await fetch('/data/cards.json');
    if (res.ok) cardsDatabase = await res.json();
  } catch (e) {}
  return cardsDatabase || [];
}

/**
 * AI Tactical Advisor Engine for Villagers Digital
 */
export class AiAdvisor {
  /**
   * Analyzes current game state and recommends the best Draft action
   */
  static async analyzeDraft(player, gameState) {
    const db = await getCardsDb();
    const recommendations = [];
    const villageCodes = (player.village || []).map(c => c.code);
    const handCodes = (player.hand || []).map(c => c.code);

    const faceUpCards = gameState.road?.face_up || [];
    const stacks = gameState.road?.stacks || [];

    // Evaluate each Face-up card on the Road
    faceUpCards.forEach((card, slotIdx) => {
      if (!card) return;
      let score = 10;
      const reasons = [];

      // 1. Placement synergy with village
      const placedOn = card.placed_on || [];
      const canPlaceInVillage = placedOn.some(code => villageCodes.includes(code));
      if (canPlaceInVillage) {
        score += 45;
        reasons.push(`Nối trực tiếp vào ${placedOn.join('/')} đang có sẵn trong Làng của bạn`);
      } else if (placedOn.length === 0 && card.code !== 'Founders') {
        score += 25;
        reasons.push('Lá bài cơ sở / độc hành, có thể xây ngay vào Làng không cần thẻ cha');
      }

      // 2. Synergy with cards in hand
      const canPlaceOnHand = placedOn.some(code => handCodes.includes(code));
      if (canPlaceOnHand) {
        score += 30;
        reasons.push(`Hợp với lá ${placedOn.join('/')} bạn đang giữ trên tay`);
      }

      // 3. Free Coin Bounties on card
      if (card.coins > 0) {
        score += card.coins * 25;
        reasons.push(`Nhặt thêm được ${card.coins} Vàng thưởng tích lũy trên thẻ`);
      }

      // 4. Provides unlock key for player's locked cards
      const unlocks = card.unlocks || [];
      const unlocksHand = unlocks.filter(code => handCodes.includes(code));
      if (unlocksHand.length > 0) {
        score += 35;
        reasons.push(`Nắm giữ chìa khóa mở cho ${unlocksHand.join(', ')} trên tay bạn (tiết kiệm 2 Vàng/lá)`);
      }

      // 5. Food or Builder limit contribution
      if (card.food > 0) {
        score += card.food * 15;
        reasons.push(`Bổ sung +${card.food} Lương thực để nháp thêm bài vòng sau`);
      }
      if (card.builder > 0) {
        score += card.builder * 15;
        reasons.push(`Bổ sung +${card.builder} Thợ xây để xây nhiều bài hơn`);
      }

      // 6. Silver scoring potential
      if (card.silver_formula) {
        score += 30;
        reasons.push(`Thẻ Bạc ghi điểm thưởng Chợ 2 (${card.silver_formula})`);
      }

      recommendations.push({
        type: 'draft_face_up',
        card: card,
        slotIndex: slotIdx,
        score: score,
        title: `Nháp lá: ${card.name}`,
        subtitle: `Hệ ${card.suit || 'Dân làng'} | ${card.coins > 0 ? `+${card.coins} Vàng Thưởng | ` : ''}Độ ưu tiên: ${score} điểm`,
        reasons: reasons
      });
    });

    // Evaluate 6 Face-down Stacks based on visible top suit
    stacks.forEach((stack, idx) => {
      const topCard = stack && stack.length > 0 ? stack[0] : null;
      if (!topCard) return;
      let score = 15;
      const reasons = [];
      const suit = topCard.suit || '';

      // Suit synergy
      const sameSuitInVillage = (player.village || []).filter(c => c.suit === suit).length;
      if (sameSuitInVillage > 0) {
        score += 20;
        reasons.push(`Làng bạn đang phát triển mạnh hệ ${suit} (${sameSuitInVillage} lá)`);
      }

      if (idx === 1 && (gameState.round || 1) >= 2) {
        score += 15;
        reasons.push('Cọc II kích hoạt Chợ 1 khi cạn bài');
      }

      recommendations.push({
        type: 'draft_face_down',
        stackIndex: idx,
        suit: suit,
        cardCount: stack.length,
        score: score,
        title: `Rút lá úp từ Cọc ${idx + 1} (Hệ ${suit})`,
        subtitle: `Cọc còn ${stack.length} lá | Độ ưu tiên: ${score} điểm`,
        reasons: reasons
      });
    });

    // Sort descending by tactical score
    recommendations.sort((a, b) => b.score - a.score);

    return {
      phase: 'draft',
      bestPick: recommendations[0] || null,
      secondPick: recommendations[1] || null,
      allPicks: recommendations
    };
  }

  /**
   * Analyzes current player hand and recommends the optimal Build sequence
   */
  static async analyzeBuild(player, gameState) {
    const hand = player.hand || [];
    const village = player.village || [];
    const villageCodes = village.map(c => c.code);
    const validBuilds = [];

    hand.forEach(card => {
      const placedOn = card.placed_on || [];
      const matchingParents = village.filter(c => placedOn.includes(c.code));
      const canBuild = placedOn.length === 0 || matchingParents.length > 0;

      if (canBuild) {
        let score = 20;
        const reasons = [];
        let padlockNote = '';

        // Padlock cost analysis
        if (card.has_padlock && card.unlocked_by) {
          const selfHasKey = villageCodes.includes(card.unlocked_by);
          if (selfHasKey) {
            score += 35;
            padlockNote = `Được mở khóa bởi ${card.unlocked_by} của bạn ➔ MIỄN PHÍ + Nhận 2 Vàng từ Ngân hàng!`;
            reasons.push(padlockNote);
          } else {
            const otherOwner = (gameState.players || []).find(p => p.id !== player.id && (p.village || []).some(c => c.code === card.unlocked_by));
            if (otherOwner) {
              score -= 10;
              padlockNote = `Bị khóa bởi ${card.unlocked_by} của ${otherOwner.name} ➔ Mất 2 Vàng cho ${otherOwner.name}`;
              reasons.push(padlockNote);
            } else {
              score -= 5;
              padlockNote = `Bị khóa ➔ Phải trả 2 Vàng cho Ngân hàng`;
              reasons.push(padlockNote);
            }
          }
        }

        // Food / Builder boost priority
        if (card.food > 0) {
          score += 25;
          reasons.push(`Nên xây sớm: Tăng giới hạn Lương thực +${card.food}`);
        }
        if (card.builder > 0) {
          score += 20;
          reasons.push(`Tăng giới hạn Thợ xây +${card.builder}`);
        }
        if (card.gold > 0) {
          score += card.gold * 10;
          reasons.push(`Ghi trực tiếp +${card.gold} Vàng in ở các phiên chợ`);
        }
        if (card.silver_formula) {
          score += 30;
          reasons.push(`Kích hoạt công thức Thẻ Bạc (${card.silver_formula})`);
        }

        validBuilds.push({
          card: card,
          bestParent: matchingParents[0] || null,
          allParents: matchingParents,
          score: score,
          title: `Xây: ${card.name}`,
          subtitle: `Hệ ${card.suit || 'Dân làng'} | ${matchingParents.length > 0 ? `Nối vào: ${matchingParents[0].name}` : 'Không cần thẻ cha'}`,
          padlockNote: padlockNote,
          reasons: reasons
        });
      }
    });

    validBuilds.sort((a, b) => b.score - a.score);

    return {
      phase: 'build',
      canBuildCount: validBuilds.length,
      bestBuild: validBuilds[0] || null,
      sequence: validBuilds
    };
  }
}

/**
 * UI Modal for AI Advisor
 */
let advisorModal = null;

function ensureAdvisorModal() {
  if (advisorModal) return advisorModal;
  advisorModal = document.createElement('div');
  advisorModal.id = 'ai-advisor-modal';
  advisorModal.className = 'modal-backdrop';
  advisorModal.innerHTML = `
    <div class="modal-dialog ai-advisor-dialog" style="max-width: 520px; width: 92%;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-delicate); padding-bottom: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="ai-avatar-rune" style="background: var(--bg-surface-inset); border: 1px solid var(--border-delicate); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            ${getIcon('lightbulb', { size: 20 })}
          </div>
          <div>
            <h3 style="color: var(--text-primary); font-size: 17px; margin: 0; font-weight: 800; letter-spacing: 0.03em;">
              CỐ VẤN CHIẾN THUẬT AI
            </h3>
            <span style="font-size: 11px; color: var(--text-secondary);">Phân tích thế trận & tối ưu nước đi theo thời gian thực</span>
          </div>
        </div>
        <button class="modal-close-btn" id="btn-close-ai-advisor-x">
          ${getIcon('close', { size: 18 })}
        </button>
      </div>

      <div id="ai-advisor-content" style="display: flex; flex-direction: column; gap: 12px; max-height: 65vh; overflow-y: auto; padding-right: 4px;">
        <!-- Dynamically injected -->
      </div>

      <div style="margin-top: 14px; text-align: right;">
        <button class="btn btn-primary" id="btn-close-ai-advisor" style="width: 100%;">
          ĐÃ HIỂU CHIẾN THUẬT
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(advisorModal);

  document.getElementById('btn-close-ai-advisor-x').addEventListener('click', closeAiAdvisor);
  document.getElementById('btn-close-ai-advisor').addEventListener('click', closeAiAdvisor);
  advisorModal.addEventListener('click', (e) => {
    if (e.target === advisorModal) closeAiAdvisor();
  });

  return advisorModal;
}

export async function openAiAdvisor(player, gameState, onExecuteAction) {
  const modal = ensureAdvisorModal();
  const content = document.getElementById('ai-advisor-content');
  audio.playButtonClick();

  content.innerHTML = `
    <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
      <div style="display: flex; justify-content: center; margin-bottom: 8px;">
        ${getIcon('lightbulb', { size: 32 })}
      </div>
      <strong>Đang phân tích bàn cờ & các chuỗi sản xuất...</strong>
    </div>
  `;
  modal.classList.add('open');

  const phaseType = (gameState.phase && gameState.phase.type) || 'draft';

  if (phaseType === 'draft') {
    const analysis = await AiAdvisor.analyzeDraft(player, gameState);
    renderDraftAdvice(content, analysis, onExecuteAction);
  } else {
    const analysis = await AiAdvisor.analyzeBuild(player, gameState);
    renderBuildAdvice(content, analysis, onExecuteAction);
  }
}

function renderDraftAdvice(container, analysis, onExecuteAction) {
  const { bestPick, secondPick } = analysis;

  if (!bestPick) {
    container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">Không còn lá bài nào khả dụng trên Con Đường.</div>`;
    return;
  }

  container.innerHTML = `
    <!-- Best Recommendation -->
    <div class="ai-recommendation-card best-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="badge-pill" style="background: var(--badge-coin-bg); border: 1px solid var(--badge-coin-border); color: var(--badge-coin-text); font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
          ${getIcon('star', { size: 12, style: 'vertical-align: -1px;' })} <span>LỰA CHỌN TỐI ƯU NHẤT (#1)</span>
        </span>
        <span style="font-size: 11px; color: var(--badge-coin-text); font-weight: 700;">Điểm chiến thuật: ${bestPick.score}</span>
      </div>
      <h4 style="color: var(--text-primary); font-size: 15px; margin: 0 0 4px 0;">${bestPick.title}</h4>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${bestPick.subtitle}</div>

      <ul style="margin: 0 0 12px 0; padding-left: 18px; font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
        ${bestPick.reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>

      <button class="btn btn-primary btn-sm" id="btn-ai-take-best" style="width: 100%; justify-content: center;">
        ${getIcon('sparkles', { size: 14 })} <span>Thực Hiện Nước Đi Này Ngay</span>
      </button>
    </div>

    <!-- Alternative Recommendation -->
    ${secondPick ? `
      <div class="ai-recommendation-card" style="background: #ffffff; border: 1px solid var(--border-delicate);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span class="badge-pill" style="background: var(--bg-surface-inset); border: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 10px;">
            PHƯƠNG ÁN DỰ PHÒNG (#2)
          </span>
          <span style="font-size: 11px; color: var(--text-muted);">Điểm: ${secondPick.score}</span>
        </div>
        <h5 style="color: var(--text-primary); font-size: 14px; margin: 0 0 4px 0;">${secondPick.title}</h5>
        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">${secondPick.subtitle}</div>
        <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: var(--text-secondary);">
          ${secondPick.reasons.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;

  const btnTakeBest = document.getElementById('btn-ai-take-best');
  if (btnTakeBest) {
    btnTakeBest.addEventListener('click', () => {
      closeAiAdvisor();
      if (onExecuteAction) {
        if (bestPick.type === 'draft_face_up') {
          onExecuteAction('draft_card', bestPick.card.id);
        } else if (bestPick.type === 'draft_face_down') {
          onExecuteAction('draft_stack', bestPick.stackIndex, bestPick.suit);
        }
      }
    });
  }
}

function renderBuildAdvice(container, analysis, onExecuteAction) {
  const { sequence, canBuildCount, bestBuild } = analysis;

  if (canBuildCount === 0) {
    container.innerHTML = `
      <div style="background: #fdf2f2; border: 1px solid #f1cfcf; border-radius: var(--radius-md); padding: 16px; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 6px;">
          ${getIcon('warning', { size: 28 })}
        </div>
        <strong style="color: #a84242; font-size: 14px;">Không có lá bài nào trên tay đủ điều kiện xây dựng lúc này!</strong>
        <p style="color: var(--text-secondary); font-size: 12px; margin: 6px 0 0 0;">
          Các lá bài trên tay bạn đều yêu cầu các thẻ cha chưa xuất hiện trong làng. Hãy bấm <strong>KẾT THÚC LƯỢT</strong> để chuyển lượt hoặc chuẩn bị cho vòng sau!
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Optimal Build Recommendation -->
    <div class="ai-recommendation-card best-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="badge-pill" style="background: var(--badge-builder-bg); border: 1px solid var(--badge-builder-border); color: var(--badge-builder-text); font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
          ${getIcon('buildPhase', { size: 13, style: 'vertical-align: -1px;' })} <span>KHUYÊN XÂY ĐẦU TIÊN (#1)</span>
        </span>
        <span style="font-size: 11px; color: var(--badge-builder-text); font-weight: 700;">Độ ưu tiên: ${bestBuild.score}</span>
      </div>
      <h4 style="color: var(--text-primary); font-size: 15px; margin: 0 0 4px 0;">${bestBuild.title}</h4>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${bestBuild.subtitle}</div>

      <ul style="margin: 0 0 12px 0; padding-left: 18px; font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
        ${bestBuild.reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>

      <button class="btn btn-primary btn-sm" id="btn-ai-build-best" style="width: 100%; justify-content: center;">
        ${getIcon('sparkles', { size: 14 })} <span>Đặt Xây Lá Này Vào Làng</span>
      </button>
    </div>

    <!-- Sequence Order -->
    ${sequence.length > 1 ? `
      <div>
        <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
          Thứ tự xây dựng kế tiếp:
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${sequence.slice(1).map((item, i) => `
            <div style="background: #ffffff; border: 1px solid var(--border-delicate); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--text-primary); font-size: 13px;">Bước ${i + 2}: ${item.card.name}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${item.subtitle}</div>
              </div>
              <span style="font-size: 12px; color: var(--badge-coin-text); font-weight: 700;">+${item.score}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  const btnBuildBest = document.getElementById('btn-ai-build-best');
  if (btnBuildBest) {
    btnBuildBest.addEventListener('click', () => {
      closeAiAdvisor();
      if (onExecuteAction) {
        onExecuteAction('build_card', bestBuild.card.id, bestBuild.bestParent ? bestBuild.bestParent.id : null);
      }
    });
  }
}

export function closeAiAdvisor() {
  if (advisorModal) {
    advisorModal.classList.remove('open');
    audio.playButtonClick();
  }
}
