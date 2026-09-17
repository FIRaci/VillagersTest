import { audio } from './audio.js';
import { getIcon } from './icons.js';
import { openInspector } from './inspector.js';

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
 * Builds hierarchical tree nodes from flat village array
 */
export function buildVillageTree(village) {
  if (!village || village.length === 0) return [];
  const roots = village.filter(c => !c.parent_instance_id);

  function makeSubtree(card) {
    const children = village.filter(c => c.parent_instance_id === card.id);
    const isTop = children.length === 0;
    return {
      card,
      isTop,
      children: children.map(makeSubtree)
    };
  }

  return roots.map(makeSubtree);
}

/**
 * Renders complete village production chains as visual branching trees
 * @param {HTMLElement} container - DOM target container
 * @param {Array} village - Cards in player's village
 * @param {Object} options - { gameState, activePlayerId, highlightedParentCodes, onSelectParent }
 */
export function renderVillageChains(container, village, options = {}) {
  container.innerHTML = '';
  if (!village || village.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); font-size: 13px; padding: 24px; text-align: center; width: 100%; border: 1.5px dashed var(--border-delicate); border-radius: var(--radius-md); background: #ffffff;">
        Chưa có Dân làng nào trong Làng. Hãy chọn và xây dựng dân làng đầu tiên!
      </div>
    `;
    return;
  }

  const trees = buildVillageTree(village);

  trees.forEach(tree => {
    const col = document.createElement('div');
    col.className = 'village-chain-column';

    // Header with suit icon & name
    const colHeader = document.createElement('div');
    colHeader.className = 'chain-col-header';
    const iconPath = `/assets/icons/${suitToIcon(tree.card.suit)}`;
    colHeader.innerHTML = `
      <img src="${iconPath}" class="token-icon" style="width:15px;height:15px;">
      <span>${tree.card.suit || 'Base'}</span>
    `;
    col.appendChild(colHeader);

    // Tree Root
    const treeRootDiv = document.createElement('div');
    treeRootDiv.className = 'chain-tree-root';
    renderTreeNode(treeRootDiv, tree, village, options);

    col.appendChild(treeRootDiv);
    container.appendChild(col);
  });
}

function renderTreeNode(parentContainer, node, village, options) {
  const { card, isTop, children } = node;
  const { gameState, activePlayerId, highlightedParentCodes = [], onSelectParent } = options;

  const nodeWrapper = document.createElement('div');
  nodeWrapper.className = 'chain-node-wrapper';

  // Card Box
  const cardBox = document.createElement('div');
  cardBox.className = 'chain-node-card-box';
  cardBox.dataset.cardId = String(card.id);

  // Villager card element
  const cardDiv = document.createElement('div');
  cardDiv.className = 'villager-card';
  cardDiv.title = `${card.name} (${card.suit || 'Base'})`;

  // Clean white card fallback face with curated pastel suit ribbon
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

  // Top Villager Indicator (crown pill)
  if (isTop) {
    const topPill = document.createElement('div');
    topPill.className = 'top-villager-pill';
    let stats = [];
    if (card.gold > 0) stats.push(`+${card.gold}<img src="/assets/icons/gold_coin.svg" class="token-inline" alt="Vàng">`);
    if (card.food > 0) stats.push(`+${card.food}<img src="/assets/icons/food_token.svg" class="token-inline" alt="Lương thực">`);
    if (card.builder > 0) stats.push(`+${card.builder}<img src="/assets/icons/builder_token.svg" class="token-inline" alt="Thợ xây">`);
    topPill.innerHTML = `${getIcon('crown', { size: 12, style: 'vertical-align: -1.5px;' })} <span>TOP</span> ${stats.join(' ')}`;
    cardBox.appendChild(topPill);
  } else {
    // Dimmed lower section if covered
    const dimmer = document.createElement('div');
    dimmer.className = 'covered-card-dimmer';
    cardBox.appendChild(dimmer);
  }

  // Coins Badge
  if (card.coins > 0) {
    const coinBadge = document.createElement('div');
    coinBadge.className = 'card-coins-cluster';
    coinBadge.innerHTML = `
      <img src="/assets/icons/gold_coin.svg" alt="Gold">
      <span>+${card.coins}</span>
    `;
    cardBox.appendChild(coinBadge);
  }

  // Padlock Badge
  if (card.has_padlock) {
    const lockBadge = document.createElement('div');
    const isUnlocked = village.some(c => c.code === card.unlocked_by);
    lockBadge.className = `card-padlock-badge ${isUnlocked ? 'unlocked' : ''}`;
    lockBadge.innerHTML = isUnlocked
      ? `${getIcon('padlockUnlocked', { size: 12 })} <span>Mở</span>`
      : `${getIcon('padlockLocked', { size: 12 })} <span>Khóa</span>`;
    cardBox.appendChild(lockBadge);
  }

  // Key Badge (if unlocks other cards)
  if (card.unlocks && card.unlocks.length > 0) {
    const keyBadge = document.createElement('div');
    keyBadge.className = 'card-key-badge';
    keyBadge.innerHTML = `${getIcon('key', { size: 12 })} <span>Chìa</span>`;
    keyBadge.title = `Mở khóa cho: ${card.unlocks.join(', ')}`;
    cardBox.appendChild(keyBadge);
  }

  // Interactive Snap Glow Target
  const isSnapTarget = highlightedParentCodes.includes(card.code);
  if (isSnapTarget) {
    cardBox.classList.add('snap-target-highlight');
    const snapBadge = document.createElement('div');
    snapBadge.className = 'snap-badge-indicator';
    snapBadge.innerHTML = '✦ CHỌN NỐI ✦';
    cardBox.appendChild(snapBadge);
  }

  // Click behavior
  cardBox.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isSnapTarget && onSelectParent) {
      audio.playCardSnapSound();
      audio.triggerHaptic([30, 20]);
      onSelectParent(card);
    } else {
      openInspector(card, gameState, activePlayerId);
    }
  });

  nodeWrapper.appendChild(cardBox);

  // Render Children / Branches (Linear cascade for single child, branching fork for 2+)
  if (children.length === 1) {
    const childContainer = document.createElement('div');
    childContainer.className = 'chain-cascade-linear';
    renderTreeNode(childContainer, children[0], village, options);
    nodeWrapper.appendChild(childContainer);
  } else if (children.length > 1) {
    const stem = document.createElement('div');
    stem.className = 'chain-branch-stem';
    nodeWrapper.appendChild(stem);

    const branchesRow = document.createElement('div');
    branchesRow.className = 'chain-branches-row';

    const forkBar = document.createElement('div');
    forkBar.className = 'chain-branch-fork-bar';
    branchesRow.appendChild(forkBar);

    children.forEach(childNode => {
      const childCol = document.createElement('div');
      childCol.className = 'chain-node-wrapper';

      const childStem = document.createElement('div');
      childStem.className = 'chain-branch-stem';
      childCol.appendChild(childStem);

      renderTreeNode(childCol, childNode, village, options);
      branchesRow.appendChild(childCol);
    });

    nodeWrapper.appendChild(branchesRow);
  }

  parentContainer.appendChild(nodeWrapper);
}
