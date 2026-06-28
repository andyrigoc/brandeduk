#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import urllib.request
import io
import json
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow for background removal...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image

WORKSPACE_DIR = r"e:\Branded_Uk_Fork_V10"

SHIRTS_TO_GENERATE = [
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20crew%20neck%20t-shirt,%20front%20view,%20realistic%203D%20ghost%20mannequin%20/%20invisible%20mannequin%20style,%20centered,%20fully%20visible,%20clean%20white%20cotton%20fabric%20with%20subtle%20natural%20folds,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/shirts/shirt-front.png"
    },
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20crew%20neck%20t-shirt,%20back%20view,%20realistic%203D%20ghost%20mannequin%20/%20invisible%20mannequin%20style,%20centered,%20fully%20visible,%20clean%20white%20cotton%20fabric%20with%20subtle%20natural%20folds,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/shirts/shirt-back.png"
    },
    {
        "url": "https://image.pollinations.ai/prompt/Plain%20white%20blank%20crew%20neck%20t-shirt,%20side%20view%20showing%20short%20sleeve,%20realistic%203D%20ghost%20mannequin%20/%20invisible%20mannequin%20style,%20centered,%20fully%20visible,%20clean%20white%20cotton%20fabric%20with%20subtle%20natural%20folds,%20solid%20black%20background?width=1024&height=1024&nologo=true&private=true",
        "dest": "customization_templates/shirts/shirt-sleeve.png"
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
        brightness = max(r, g, b)
        
        # Smooth alpha blending for black background removal
        if brightness <= 5:
            new_data.append((0, 0, 0, 0))
        elif brightness < 35:
            alpha = int((brightness - 5) * (255 / 30))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

def main():
    dest_dir = os.path.join(WORKSPACE_DIR, "customization_templates", "shirts")
    os.makedirs(dest_dir, exist_ok=True)

    print("Generating crew neck t-shirt templates (front, back, sleeve) via Pollinations.ai...")
    for item in SHIRTS_TO_GENERATE:
        url = item["url"]
        dest_rel = item["dest"]
        dest_path = os.path.join(WORKSPACE_DIR, dest_rel)
        print(f"Generating and downloading to {dest_rel}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                img_bytes = response.read()
            processed_img = remove_black_background(img_bytes)
            processed_img.save(dest_path, "PNG")
            print(f"Successfully saved to {dest_rel}")
        except Exception as e:
            print(f"ERROR generating {dest_rel}: {e}")

if __name__ == "__main__":
    main()
