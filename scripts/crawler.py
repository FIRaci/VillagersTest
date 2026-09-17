import os
import re
import json
import urllib.request
import time
from urllib.parse import urljoin

BASE_URL = "https://www.yucata.de/game-plugins/villagers/1.1.13/images/"
CONTENT_PATH = r"C:\Users\TSC\.gemini\antigravity-ide\brain\32e7f1fe-199f-4749-98d9-5a87f86bbe46\.system_generated\steps\19\content.md"

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
CARDS_IMG_DIR = os.path.join(ASSETS_DIR, "cards")
ICONS_IMG_DIR = os.path.join(ASSETS_DIR, "icons")
RULES_IMG_DIR = os.path.join(ASSETS_DIR, "rules")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

os.makedirs(CARDS_IMG_DIR, exist_ok=True)
os.makedirs(ICONS_IMG_DIR, exist_ok=True)
os.makedirs(RULES_IMG_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def download_images(image_list):
    print(f"=== DOWNLOADING {len(image_list)} ASSETS FROM YUCATA ===")
    downloaded = 0
    failed = 0
    
    for idx, rel_path in enumerate(image_list):
        url = urljoin(BASE_URL, rel_path)
        if rel_path.startswith("rules/"):
            dest = os.path.join(RULES_IMG_DIR, os.path.basename(rel_path))
        elif any(rel_path.startswith(prefix) for prefix in ["food", "house", "sign", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "bronze", "firstplayer", "title", "villagers", "x"]):
            dest = os.path.join(ICONS_IMG_DIR, os.path.basename(rel_path))
        else:
            dest = os.path.join(CARDS_IMG_DIR, os.path.basename(rel_path))
            
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            downloaded += 1
            continue
            
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp, open(dest, 'wb') as f:
                f.write(resp.read())
            downloaded += 1
            if (idx + 1) % 20 == 0 or (idx + 1) == len(image_list):
                print(f"Progress: {idx+1}/{len(image_list)} downloaded...")
            time.sleep(0.05)
        except Exception as e:
            print(f"Failed to download {url}: {e}")
            failed += 1

    print(f"Asset download complete! Success: {downloaded}, Failed: {failed}")
    return downloaded, failed

def extract_suit_from_text(details_text, card_id):
    suit_map = {
        "grain": "Grain",
        "wood": "Wood",
        "hay": "Hay",
        "ore": "Ore",
        "grape": "Grapes",
        "wool": "Wool",
        "leather": "Leather",
        "solitary": "Solitary",
        "special": "Special"
    }
    t = details_text.lower()
    for k, v in suit_map.items():
        if f"{k} suit" in t or f"{k}  suit" in t:
            return v
    if "founders" in card_id.lower() or "brewer" in card_id.lower():
        return "Grain"
    if "solitary" in t:
        return "Solitary"
    if "special" in t:
        return "Special"
    return "Unknown"

def parse_card_html(text):
    print("=== PARSING CARD DEFINITIONS ===")
    # Extract all card paragraphs
    paragraphs = re.findall(r'<div id="([^"]+)" class="paragraph([^"]*)">(.*?)</div>\s*(?=<div id=|<div class="appendix|<div class="chapter|$)', text, re.DOTALL)
    
    cards = []
    
    for cid, pclasses, body in paragraphs:
        h3_match = re.search(r'<h3>(.*?)</h3>', body)
        name = h3_match.group(1).strip() if h3_match else cid
        
        # Images
        raw_imgs = re.findall(r'/game-plugins/villagers/1\.1\.13/images/([a-zA-Z0-9_\-\./]+\.png)', body)
        img_paths = []
        for img in raw_imgs:
            fname = os.path.basename(img)
            if img.startswith("rules/"):
                img_paths.append(f"assets/rules/{fname}")
            elif any(fname.startswith(prefix) for prefix in ["food", "house", "sign", "s", "bronze", "firstplayer"]):
                img_paths.append(f"assets/icons/{fname}")
            else:
                img_paths.append(f"assets/cards/{fname}")
                
        # Parse text paragraphs
        ptags = re.findall(r'<p(?: class="([^"]*)")?>(.*?)</p>', body, re.DOTALL)
        details = []
        clarification = None
        deviation = None
        
        for pclass, pcontent in ptags:
            clean = re.sub(r'<[^>]+>', ' ', pcontent).strip()
            clean = re.sub(r'\s+', ' ', clean)
            if pclass == "clarification":
                clarification = clean
            elif pclass == "deviation":
                deviation = clean
            else:
                details.append(clean)
                
        full_text = " ".join(details)
        
        # Determine Card Set
        card_set = "base"
        if cid.startswith("d") or "Condition:" in full_text:
            card_set = "developments"
        elif cid.startswith("e") or "Countess" in name or "Jester" in name or "Solo Mode" in body:
            card_set = "solo"
        elif any(x in body for x in ["xprofiteers", "Profiteers"]):
            card_set = "profiteers"
        elif any(x in body for x in ["xsaints", "Saints"]):
            card_set = "saints"
        elif any(x in body for x in ["xscoundrels", "Scoundrels"]):
            card_set = "scoundrels"
            
        # Parse stats
        food = 0
        builder = 0
        gold = 0
        
        food_match = re.search(r'(\d+)\s*Food', full_text, re.IGNORECASE)
        if food_match:
            food = int(food_match.group(1))
            
        builder_match = re.search(r'(\d+)\s*Builder', full_text, re.IGNORECASE)
        if builder_match:
            builder = int(builder_match.group(1))
            
        gold_match = re.search(r'(\d+)\s*Gold', full_text, re.IGNORECASE)
        if gold_match:
            gold = int(gold_match.group(1))
            
        # Production Chain: Played on & Precedes
        played_on = []
        played_on_match = re.search(r'Played on:\s*([^.]+?)(?=\s*Unlocked by:|\s*Unlocks:|\s*Precedes:|$)', full_text, re.IGNORECASE)
        if played_on_match:
            raw_po = played_on_match.group(1).strip()
            played_on = [x.strip() for x in raw_po.split(',') if x.strip()]
            
        precedes = []
        precedes_match = re.search(r'Precedes:\s*([^.]+?)(?=\s*Unlocked by:|\s*Unlocks:|\s*Played on:|$)', full_text, re.IGNORECASE)
        if precedes_match:
            raw_pr = precedes_match.group(1).strip()
            precedes = [x.strip() for x in raw_pr.split(',') if x.strip()]
            
        # Padlock info: Unlocked by & Unlocks
        unlocked_by = None
        unlocked_by_match = re.search(r'Unlocked by:\s*([^.]+?)(?=\s*Unlocks:|\s*Played on:|\s*Precedes:|$)', full_text, re.IGNORECASE)
        if unlocked_by_match:
            unlocked_by = unlocked_by_match.group(1).strip()
            
        unlocks = []
        unlocks_match = re.search(r'Unlocks:\s*([^.]+?)(?=\s*Unlocked by:|\s*Played on:|\s*Precedes:|$)', full_text, re.IGNORECASE)
        if unlocks_match:
            raw_u = unlocks_match.group(1).strip()
            unlocks = [x.strip() for x in raw_u.split(',') if x.strip()]
            
        # Silver formula
        silver_formula = None
        silver_match = re.search(r'Silver[^:]*:\s*(.*?)(?=\.|$)', full_text, re.IGNORECASE)
        if silver_match:
            silver_formula = silver_match.group(1).strip()
        elif "silver" in full_text.lower():
            for d in details:
                if "silver" in d.lower():
                    silver_formula = d
                    break
                    
        # Suit
        suit = extract_suit_from_text(full_text, cid)
        if card_set == "developments":
            suit = "Development"
        elif card_set == "solo" and suit == "Unknown":
            suit = "SoloEvent"
            
        # Deck count
        if cid == "Founders":
            count = 5 # 1 per player
        elif cid in ["Lumberjack", "Hayer", "Miner"]:
            count = 10 # 10 each basic
        elif card_set in ["developments", "solo"]:
            count = 1
        else:
            count = 2 # standard base villagers appear twice
            
        card_obj = {
            "id": cid.lower(),
            "code": cid,
            "name": name,
            "set": card_set,
            "suit": suit,
            "gold": gold,
            "food": food,
            "builder": builder,
            "silver_formula": silver_formula,
            "production_chain": {
                "placed_on": played_on,
                "precedes": precedes
            },
            "padlock": {
                "has_padlock": unlocked_by is not None,
                "unlocked_by": unlocked_by,
                "unlocks": unlocks
            },
            "deck_count": count,
            "images": img_paths,
            "primary_image": img_paths[0] if img_paths else None,
            "description": full_text,
            "clarification": clarification,
            "deviation": deviation
        }
        cards.append(card_obj)
        
    print(f"Parsed {len(cards)} cards successfully.")
    return cards

def generate_game_rules():
    rules = {
        "name": "Villagers",
        "author": "Haakon Hoel Gaarder",
        "publisher": "Sinister Fish Games",
        "players": {
            "min": 1,
            "max": 5,
            "recommended": "2-4"
        },
        "setup_by_player_count": {
            "2": {
                "stacks_count": 6,
                "cards_per_stack": 4,
                "remove_suits": ["Wool", "Leather"],
                "starting_hand": 5,
                "starting_gold": 8,
                "road_update_rule": "two_player_auction"
            },
            "3": {
                "stacks_count": 6,
                "cards_per_stack": 6,
                "remove_suits": ["Wool", "Leather"],
                "starting_hand": 5,
                "starting_gold": 8,
                "road_update_rule": "multiplayer_standard"
            },
            "4": {
                "stacks_count": 6,
                "cards_per_stack": 8,
                "remove_suits": [],
                "starting_hand": 5,
                "starting_gold": 8,
                "road_update_rule": "multiplayer_standard"
            },
            "5": {
                "stacks_count": 6,
                "cards_per_stack": 10,
                "remove_suits": [],
                "starting_hand": 5,
                "starting_gold": 8,
                "road_update_rule": "multiplayer_standard"
            }
        },
        "limits": {
            "base_draft": 2,
            "max_draft": 5,
            "draft_formula": "2 + food_in_village",
            "base_build": 2,
            "max_build": 5,
            "build_formula": "2 + builder_in_village",
            "max_basic_villagers_per_round": 3,
            "padlock_cost": 2
        },
        "market_phases": {
            "market_1": {
                "trigger": "First two road stacks are empty (after build phase)",
                "scores": ["gold_on_top_cards", "coins_on_cards"]
            },
            "market_2": {
                "trigger": "All six road stacks are empty (after build phase)",
                "scores": ["gold_on_top_cards", "coins_on_cards", "silver_scoring_conditions"]
            }
        },
        "suits": [
            {"id": "grain", "name": "Grain", "color": "#E6B800", "icon": "assets/icons/s1.png", "starter": "Founders"},
            {"id": "wood", "name": "Wood", "color": "#7A5230", "icon": "assets/icons/s2.png", "starter": "Lumberjack"},
            {"id": "hay", "name": "Hay", "color": "#D4A017", "icon": "assets/icons/s3.png", "starter": "Hayer"},
            {"id": "ore", "name": "Ore", "color": "#708090", "icon": "assets/icons/s4.png", "starter": "Miner"},
            {"id": "grapes", "name": "Grapes", "color": "#800080", "icon": "assets/icons/s5.png", "starter": "Vintner/Grape Picker"},
            {"id": "wool", "name": "Wool", "color": "#4682B4", "icon": "assets/icons/s6.png", "starter": "Shepherd"},
            {"id": "leather", "name": "Leather", "color": "#8B4513", "icon": "assets/icons/s7.png", "starter": "Tanner"},
            {"id": "solitary", "name": "Solitary", "color": "#2E8B57", "icon": "assets/icons/s8.png", "starter": None},
            {"id": "special", "name": "Special", "color": "#B22222", "icon": "assets/icons/s9.png", "starter": None}
        ]
    }
    
    with open(os.path.join(DATA_DIR, "game_rules.json"), "w", encoding="utf-8") as f:
        json.dump(rules, f, indent=2, ensure_ascii=False)
    print("Wrote data/game_rules.json")

def main():
    print("Starting Villagers Data & Asset Pipeline...")
    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        text = f.read()
        
    # 1. Find all images referenced
    images = sorted(list(set(re.findall(r"/game-plugins/villagers/1\.1\.13/images/([a-zA-Z0-9_\-\./]+\.png)", text))))
    print(f"Identified {len(images)} unique PNG images from Yucata.")
    
    # 2. Download all images
    download_images(images)
    
    # 3. Parse cards
    cards = parse_card_html(text)
    
    # 4. Save cards.json
    cards_file = os.path.join(DATA_DIR, "cards.json")
    with open(cards_file, "w", encoding="utf-8") as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(cards)} card records to {cards_file}")
    
    # 5. Save game_rules.json
    generate_game_rules()
    
    # 6. Summary check
    print("=== PIPELINE SUMMARY ===")
    print(f"Cards in database: {len(cards)}")
    cards_in_dir = len(os.listdir(CARDS_IMG_DIR))
    icons_in_dir = len(os.listdir(ICONS_IMG_DIR))
    rules_in_dir = len(os.listdir(RULES_IMG_DIR))
    print(f"Assets downloaded: {cards_in_dir} card images, {icons_in_dir} icons, {rules_in_dir} rule diagrams.")
    print(f"Total images stored: {cards_in_dir + icons_in_dir + rules_in_dir} / {len(images)}")
    print("Pipeline finished successfully!")

if __name__ == "__main__":
    main()
