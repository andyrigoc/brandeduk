#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import shutil
import urllib.request
import io
import json
import subprocess
import sys

# Ensure pillow is installed for image processing
try:
    from PIL import Image
except ImportError:
    print("Installing Pillow for background removal...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image

BRAIN_DIR = r"C:\Users\Hp\.gemini\antigravity-ide\brain\08afac97-b824-4f06-a450-c4282e7142d7"
WORKSPACE_DIR = r"e:\Branded_Uk_Fork_V10"

# List of files already generated to copy
FILES_TO_COPY = [
    # Fleece
    ("fleece_front_1782460530606.png", "customization_templates/fleece/fleece-front.png"),
    ("fleece_back_1782463989286.png", "customization_templates/fleece/fleece-back.png"),
    ("fleece_sleeve_1782464040926.png", "customization_templates/fleece/fleece-sleeve.png"),
    # Trousers
    ("trouser_front_1782464071421.png", "customization_templates/trousers/trouser-front.png"),
    ("trouser_back_1782464106258.png", "customization_templates/trousers/trouser-back.png"),
    # Beanies
    ("beanie_front_1782464126978.png", "customization_templates/beanies/beanie-front.png"),
    ("beanie_side_1782464149014.png", "customization_templates/beanies/beanie-side.png"),
    # Shorts
    ("shorts_front_1782464208229.png", "customization_templates/shorts/shorts-front.png"),
    ("shorts_back_1782464270103.png", "customization_templates/shorts/shorts-back.png"),
    # Sweatpants
    ("sweatpants_front_1782464330557.png", "customization_templates/sweatpants/sweatpants-front.png"),
    ("sweatpants_back_1782464388602.png", "customization_templates/sweatpants/sweatpants-back.png"),
    # Vests
    ("vest_front_1782464441021.png", "customization_templates/vests_tshirt/vest-front.png"),
    ("vest_back_1782464486309.png", "customization_templates/vests_tshirt/vest-back.png"),
    # Aprons
    ("apron_front_1782464538047.png", "customization_templates/aprons/apron-front.png"),
    # Hats
    ("hat_front_1782464563671.png", "customization_templates/hats/hat-front.png"),
    ("hat_side_1782464584466.png", "customization_templates/hats/hat-side.png"),
]

# Remaining images to download from Pollinations.ai with a black background and process
IMAGES_TO_DOWNLOAD = [
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20bath%20towel,%20flat%20front-facing%20rectangular%20view,%20centered,%20fully%20visible,%20realistic%203D%20product%20template%20style,%20soft%20depth%20and%20subtle%20fabric%20texture%20folds,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/towels/towel-front.png"
    },
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20hi-vis%20safety%20vest,%20front%20view,%20reflective%20strip%20layout%20visible%20as%20subtle%20stitching%20strip%20areas%20but%20keep%20base%20plain%20white,%20realistic%203D%20ghost%20mannequin%20style,%20centered,%20fully%20visible,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/hi_vis/hivis-front.png"
    },
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20hi-vis%20safety%20vest,%20back%20view,%20reflective%20strip%20layout%20visible%20as%20subtle%20stitching%20strip%20areas%20but%20keep%20base%20plain%20white,%20realistic%203D%20ghost%20mannequin%20style,%20centered,%20fully%20visible,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/hi_vis/hivis-back.png"
    }
]

def remove_black_background(img_data):
    """
    Removes black background and returns PIL Image with transparent background.
    Uses soft edge thresholding to prevent aliasing issues.
    """
    img = Image.open(io.BytesIO(img_data)).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        # Calculate pixel brightness (intensity)
        brightness = max(r, g, b)
        
        # Smooth alpha blending for black background removal
        if brightness <= 5:
            # Fully transparent for pure black
            new_data.append((0, 0, 0, 0))
        elif brightness < 35:
            # Linear alpha transition for edges
            alpha = int((brightness - 5) * (255 / 30))
            new_data.append((r, g, b, alpha))
        else:
            # Keep original pixel
            new_data.append(item)
            
    img.putdata(new_data)
    return img

def main():
    # 1. Create directories
    for category in ["fleece", "trousers", "beanies", "shorts", "sweatpants", "vests_tshirt", "aprons", "hats", "towels", "hi_vis"]:
        path = os.path.join(WORKSPACE_DIR, "customization_templates", category)
        os.makedirs(path, exist_ok=True)
        print(f"Verified directory: {path}")

    # 2. Copy files
    print("\nCopying generated files from brain directory...")
    for src_name, dest_rel in FILES_TO_COPY:
        src_path = os.path.join(BRAIN_DIR, src_name)
        dest_path = os.path.join(WORKSPACE_DIR, dest_rel)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"Copied {src_name} -> {dest_rel}")
        else:
            print(f"WARNING: Source file {src_path} not found!")

    # 3. Download and process remaining images
    print("\nDownloading and processing remaining templates from Pollinations.ai...")
    for item in IMAGES_TO_DOWNLOAD:
        url = item["url"]
        dest_rel = item["dest"]
        dest_path = os.path.join(WORKSPACE_DIR, dest_rel)
        print(f"Downloading to {dest_rel}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                img_bytes = response.read()
            processed_img = remove_black_background(img_bytes)
            processed_img.save(dest_path, "PNG")
            print(f"Successfully processed and saved to {dest_rel}")
        except Exception as e:
            print(f"ERROR downloading/processing {dest_rel}: {e}")

    # 4. Update manifest.json
    manifest_path = os.path.join(WORKSPACE_DIR, "customization_templates", "manifest.json")
    if os.path.exists(manifest_path):
        print("\nUpdating manifest.json...")
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Get existing templates
        templates = data.get("templates", [])
        
        # New Batch 2 templates to insert/update
        batch2_templates = [
            {
                "category": "fleece",
                "views": {
                    "front": "customization_templates/fleece/fleece-front.png",
                    "back": "customization_templates/fleece/fleece-back.png",
                    "sleeve": "customization_templates/fleece/fleece-sleeve.png"
                }
            },
            {
                "category": "trousers",
                "views": {
                    "front": "customization_templates/trousers/trouser-front.png",
                    "back": "customization_templates/trousers/trouser-back.png"
                }
            },
            {
                "category": "beanies",
                "views": {
                    "front": "customization_templates/beanies/beanie-front.png",
                    "side": "customization_templates/beanies/beanie-side.png"
                }
            },
            {
                "category": "shorts",
                "views": {
                    "front": "customization_templates/shorts/shorts-front.png",
                    "back": "customization_templates/shorts/shorts-back.png"
                }
            },
            {
                "category": "sweatpants",
                "views": {
                    "front": "customization_templates/sweatpants/sweatpants-front.png",
                    "back": "customization_templates/sweatpants/sweatpants-back.png"
                }
            },
            {
                "category": "vests_tshirt",
                "views": {
                    "front": "customization_templates/vests_tshirt/vest-front.png",
                    "back": "customization_templates/vests_tshirt/vest-back.png"
                }
            },
            {
                "category": "aprons",
                "views": {
                    "front": "customization_templates/aprons/apron-front.png"
                }
            },
            {
                "category": "hats",
                "views": {
                    "front": "customization_templates/hats/hat-front.png",
                    "side": "customization_templates/hats/hat-side.png"
                }
            },
            {
                "category": "towels",
                "views": {
                    "front": "customization_templates/towels/towel-front.png"
                }
            },
            {
                "category": "hi_vis",
                "views": {
                    "front": "customization_templates/hi_vis/hivis-front.png",
                    "back": "customization_templates/hi_vis/hivis-back.png"
                }
            }
        ]
        
        # Remove any existing template categories from Batch 2 if they are already in the list
        existing_categories = [t["category"] for t in templates]
        for b2_t in batch2_templates:
            if b2_t["category"] in existing_categories:
                idx = existing_categories.index(b2_t["category"])
                templates[idx] = b2_t
            else:
                templates.append(b2_t)
                
        data["templates"] = templates
        
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        print("manifest.json updated successfully.")

if __name__ == "__main__":
    main()
