/**
 * Villagers Digital - Vector SVG Icon Registry
 * Zero-emoji, crisp 1.75px stroke, dark medieval luxury styling
 */

const ICONS = {
  // Resources & Attributes
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" fill="url(#goldGrad)" stroke="var(--suit-grain, #b58d3d)" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="6.5" stroke="var(--text-gold, #8a681c)" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M12 8.5v7M10 10.5c.6-.7 1.4-1 2-1s2 .4 2 1.2c0 1.5-4 1.3-4 2.8 0 .8.8 1.5 2 1.5s2-.5 2-1" stroke="#5c4217" stroke-width="1.5"/>
    <defs>
      <radialGradient id="goldGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#fae5b8"/>
        <stop offset="50%" stop-color="#d9ad52"/>
        <stop offset="100%" stop-color="#9c7228"/>
      </radialGradient>
    </defs>
  </svg>`,

  food: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 20c4-4 7-9 8-15 1 6 4 11 8 15" stroke="var(--suit-wood, #658a69)"/>
    <path d="M12 20V5" stroke="var(--suit-wood, #658a69)"/>
    <path d="M7 14c2-1 3-3 4-6M17 14c-2-1-3-3-4-6" stroke="var(--suit-wood, #658a69)"/>
    <path d="M8 18c2-.5 3-2 3.5-4M16 18c-2-.5-3-2-3.5-4" stroke="var(--suit-wood, #658a69)"/>
  </svg>`,

  builder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 12l5.5-5.5a2.12 2.12 0 00-3-3L12 9"/>
    <path d="M17.5 3.5l3 3"/>
    <path d="M3 21l8-8"/>
    <path d="M4.5 16.5l3 3"/>
    <path d="M9 15l-3-3"/>
    <rect x="2" y="19" width="3" height="3" rx="0.5" fill="currentColor"/>
  </svg>`,

  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 18h18v2H3v-2zM4 16l2.5-9 5.5 5 5.5-5 2.5 9H4z" fill="url(#crownGrad)" stroke="var(--suit-grain, #b58d3d)"/>
    <circle cx="6.5" cy="7" r="1.5" fill="#b58d3d"/>
    <circle cx="12" cy="12" r="1.5" fill="#b58d3d"/>
    <circle cx="17.5" cy="7" r="1.5" fill="#b58d3d"/>
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fae5b8" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#b58d3d" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
  </svg>`,

  // Navigation & Views
  road: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19L9 4h6l5 15"/>
    <path d="M12 8v2M12 14v3" stroke-dasharray="1 1"/>
  </svg>`,

  village: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10l9-7 9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"/>
    <path d="M9 21V12h6v9"/>
    <path d="M9 7l3-2.3L15 7"/>
  </svg>`,

  opponents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>`,

  deck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="13" height="17" rx="2"/>
    <path d="M8 2h10a2 2 0 012 2v14"/>
  </svg>`,

  // Padlock & Chains
  padlockLocked: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="11" width="16" height="11" rx="2" fill="rgba(184, 93, 86, 0.12)" stroke="#b85d56"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#b85d56"/>
    <circle cx="12" cy="16" r="1.5" fill="#b85d56"/>
  </svg>`,

  padlockUnlocked: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="11" width="16" height="11" rx="2" fill="rgba(101, 138, 105, 0.12)" stroke="#658a69"/>
    <path d="M7 11V7a5 5 0 019.9-1" stroke="#658a69"/>
    <circle cx="12" cy="16" r="1.5" fill="#658a69"/>
  </svg>`,

  // Tabletop & Host Controls
  undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l4-4M3 9l4 4M3 9h11a6 6 0 110 12h-4"/>
  </svg>`,

  redo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 9l-4-4M21 9l-4 4M21 9H10a6 6 0 100 12h4"/>
  </svg>`,

  shuffle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5"/>
  </svg>`,

  deal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="14" height="14" rx="2"/>
    <path d="M6 3h14a2 2 0 012 2v12"/>
    <path d="M10 14l4-4M10 10h4v4"/>
  </svg>`,

  goldAdjust: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="12" r="7"/>
    <path d="M19 8v8M15 12h8"/>
  </svg>`,

  forcePhase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
  </svg>`,

  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18v3M18 14v3"/>
  </svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>`,

  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>`,

  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>`,

  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>`,

  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>`,

  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="var(--suit-grain, #b58d3d)"/>
  </svg>`,

  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="7.5" cy="15.5" r="4.5" stroke="var(--suit-grain, #b58d3d)"/>
    <circle cx="7.5" cy="15.5" r="1.5" fill="var(--suit-grain, #b58d3d)"/>
    <path d="M11 12l9-9M17 3l3 3M14 6l3 3" stroke="var(--suit-grain, #b58d3d)"/>
  </svg>`,

  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>`,

  // Game Attributes & Awards
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/>
    <path d="M6 3h12v7a6 6 0 01-12 0V3z" fill="url(#trophyGrad)" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M12 16v4M8 20h8"/>
    <path d="M12 6.8l.6 1.4 1.5.2-1.1 1 .3 1.5-1.3-.7-1.3.7.3-1.5-1.1-1 1.5-.2.6-1.4z" fill="#9c7228" stroke="none"/>
    <defs>
      <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fae5b8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#d9ad52" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
  </svg>`,

  lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18h6M10 21h4"/>
    <path d="M12 2a7 7 0 00-5 11.9v2.1a1 1 0 001 1h8a1 1 0 001-1v-2.1A7 7 0 0012 2z" fill="url(#bulbGrad)" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M12 6v4M10 8h4" stroke="#8a681c"/>
    <defs>
      <radialGradient id="bulbGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#fff9ea"/>
        <stop offset="60%" stop-color="#fae5b8"/>
        <stop offset="100%" stop-color="#d9ad52"/>
      </radialGradient>
    </defs>
  </svg>`,

  market: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l2-5h14l2 5"/>
    <path d="M21 9v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9"/>
    <path d="M3 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3"/>
    <path d="M9 21v-7h6v7"/>
  </svg>`,

  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#starGrad)" stroke="var(--suit-grain, #b58d3d)"/>
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff2ce"/>
        <stop offset="100%" stop-color="#d9ad52"/>
      </linearGradient>
    </defs>
  </svg>`,

  themeWood: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="12" cy="6" rx="8" ry="3.5" fill="#c49b66" stroke="#6d4c20"/>
    <ellipse cx="12" cy="6" rx="4.5" ry="2" stroke="#4a3110" stroke-width="1.2" stroke-dasharray="2 1"/>
    <circle cx="12" cy="12" r="1" fill="#4a3110"/>
    <path d="M4 6v12c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5V6" fill="#8c6239" stroke="#6d4c20"/>
    <path d="M4 12c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5" stroke="#6d4c20" stroke-width="1"/>
  </svg>`,

  themeWhite: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" fill="#ffffff" stroke="var(--border-strong, #c8c0b2)" stroke-width="1.75"/>
    <circle cx="12" cy="12" r="6" stroke="var(--border-delicate, #e5e0d8)" stroke-width="1.2" stroke-dasharray="3 2"/>
    <circle cx="12" cy="12" r="2.5" fill="var(--text-secondary, #5c554e)"/>
  </svg>`,

  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="rgba(217, 83, 79, 0.12)" stroke="#b85d56"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="#b85d56" stroke-width="2"/>
    <circle cx="12" cy="17" r="1" fill="#b85d56"/>
  </svg>`,

  draftPhase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22V8" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M7 16c2.5-1 4-3.5 5-7 1 3.5 2.5 6 5 7" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M8 12c1.5-.7 3-2 4-4.5 1 2.5 2.5 3.8 4 4.5" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M9.5 7.5C10.5 7 11.5 6 12 4c.5 2 1.5 3 2.5 3.5" stroke="var(--suit-grain, #b58d3d)"/>
    <path d="M10 20h4" stroke="var(--suit-grain, #b58d3d)"/>
  </svg>`,

  buildPhase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 6l4 4L7 21H3v-4L14 6z"/>
    <path d="M17 3l4 4-2 2-4-4 2-2z" fill="var(--badge-builder-border, #e6beaa)"/>
    <path d="M14 9l1 1"/>
  </svg>`
};

/**
 * Returns raw SVG string with given size and class
 * @param {string} name - Icon name
 * @param {Object} options - { size, className, style }
 * @returns {string} SVG HTML string
 */
export function getIcon(name, options = {}) {
  const svg = ICONS[name];
  if (!svg) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  const size = options.size || 18;
  const className = options.className ? `svg-icon ${options.className}` : 'svg-icon';
  const style = options.style || '';

  // Inject class and inline size
  return svg.replace(
    '<svg ',
    `<svg class="${className}" width="${size}" height="${size}" style="${style}" aria-hidden="true" `
  );
}

export default ICONS;
