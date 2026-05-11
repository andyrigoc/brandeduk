#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('home-pc.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace malformed UTF-8 display
content = content.replace('\u00e2\u0086\u0092', '&rarr;')  # â†' -> &rarr;
content = content.replace('\u00e2\u0080\u0094', '&mdash;')  # â€" -> &mdash;
content = content.replace('\u00e2\u0080\u00a2', '&bull;')  # â€¢ -> &bull;
content = content.replace('\u00c2\u00ae', '&reg;')  # Â® -> &reg;
content = content.replace('\u00c2\u00b0', '&deg;')  # Â° -> &deg;

with open('home-pc.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('Fixed encoding issues!')
