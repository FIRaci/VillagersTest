import os
import base64

suits = [
    ('grain', 'GRAINS', 'LÚA MÌ', '#2ea692', 's1.png'),
    ('wood', 'WOOD', 'GỖ', '#469c3a', 's2.png'),
    ('hay', 'HAY', 'CỎ KHÔ', '#7d3a8c', 's3.png'),
    ('ore', 'ORE', 'QUẶNG MỎ', '#2a2f34', 's4.png'),
    ('grapes', 'GRAPES', 'NHO', '#c8317e', 's5.png'),
    ('wool', 'WOOL', 'LEN DẠ', '#269cdb', 's6.png'),
    ('leather', 'LEATHER', 'DA THUỘC', '#dc9223', 's7.png'),
    ('solitary', 'SOLITARY', 'ĐỘC HÀNH', '#6f492e', 's8.png'),
    ('special', 'SPECIAL', 'ĐẶC BIỆT', '#c02d2d', 's9.png'),
]

os.makedirs('Villagers/assets/backs', exist_ok=True)

for slug, name, vn_name, color, icon_file in suits:
    icon_path = os.path.join('Villagers/assets/icons', icon_file)
    with open(icon_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 400" width="250" height="400">
  <defs>
    <!-- Linen Paper Texture Gradient -->
    <linearGradient id="cardPaper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#faf6ee"/>
      <stop offset="100%" stop-color="#f3ede0"/>
    </linearGradient>

    <!-- House Drop Shadow -->
    <filter id="houseShadow" x="-15%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
    </filter>

    <!-- Icon Halo -->
    <filter id="iconHalo" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Card Base with Rounded Corners -->
  <rect x="2" y="2" width="246" height="396" rx="14" fill="url(#cardPaper)" stroke="#d8cfbe" stroke-width="2"/>
  
  <!-- Inner Stitched / Inset Border -->
  <rect x="10" y="10" width="230" height="380" rx="10" fill="none" stroke="{color}" stroke-width="1.5" stroke-opacity="0.45" stroke-dasharray="5 3"/>

  <!-- Suit Vietnamese Title -->
  <text x="125" y="48" font-family="'Cinzel', 'Alegreya SC', Georgia, serif" font-size="20" font-weight="900" fill="{color}" text-anchor="middle" letter-spacing="2.5">{vn_name}</text>

  <!-- Suit English Subtitle -->
  <text x="125" y="70" font-family="'Cinzel', 'Alegreya SC', Georgia, serif" font-size="11" font-weight="700" fill="{color}" fill-opacity="0.65" text-anchor="middle" letter-spacing="4">{name}</text>

  <!-- Iconic House Silhouette with Chimney -->
  <g filter="url(#houseShadow)">
    <!-- Chimney -->
    <rect x="148" y="108" width="16" height="40" rx="2" fill="{color}"/>
    <!-- House Body and Gable Roof -->
    <path d="M 125 102 L 190 172 L 178 172 L 178 296 L 72 296 L 72 172 L 60 172 Z" fill="{color}"/>
  </g>

  <!-- Center Circular Icon Well -->
  <circle cx="125" cy="226" r="43" fill="#ffffff" fill-opacity="0.96" stroke="{color}" stroke-width="3" filter="url(#iconHalo)"/>

  <!-- High-res Suit Emblem Icon -->
  <image href="data:image/png;base64,{b64}" x="90" y="191" width="70" height="70"/>

  <!-- Bottom Accent / Decorative Dot -->
  <circle cx="125" cy="352" r="4" fill="{color}" fill-opacity="0.6"/>
  <line x1="65" y1="352" x2="105" y2="352" stroke="{color}" stroke-width="1.5" stroke-opacity="0.4" stroke-linecap="round"/>
  <line x1="145" y1="352" x2="185" y2="352" stroke="{color}" stroke-width="1.5" stroke-opacity="0.4" stroke-linecap="round"/>
</svg>"""

    out_file = f'Villagers/assets/backs/back_{slug}.svg'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f'Wrote {out_file}')

# Also write default generic back
default_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 400" width="250" height="400">
  <rect x="2" y="2" width="246" height="396" rx="14" fill="#2c1e13" stroke="#d4af37" stroke-width="3"/>
  <rect x="10" y="10" width="230" height="380" rx="10" fill="none" stroke="#ffd700" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="4 3"/>
  <text x="125" y="65" font-family="'Cinzel', Georgia, serif" font-size="20" font-weight="900" fill="#f4e8d3" text-anchor="middle" letter-spacing="4">VILLAGERS</text>
  <circle cx="125" cy="200" r="46" fill="none" stroke="#d4af37" stroke-width="2"/>
  <text x="125" y="208" font-family="'Cinzel', Georgia, serif" font-size="26" font-weight="900" fill="#ffd700" text-anchor="middle">🏰</text>
  <text x="125" y="340" font-family="'Cinzel', Georgia, serif" font-size="12" font-weight="700" fill="#baa377" text-anchor="middle" letter-spacing="3">CON ĐƯỜNG</text>
</svg>"""
with open('Villagers/assets/backs/back_default.svg', 'w', encoding='utf-8') as f:
    f.write(default_svg)
print('Wrote Villagers/assets/backs/back_default.svg')
