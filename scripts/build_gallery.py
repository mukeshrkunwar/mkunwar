#!/usr/bin/env python3
"""Scan images/gallery/** and write data/gallery.json."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAL = os.path.join(ROOT, "images", "gallery")
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"}

caps = {}
cp = os.path.join(GAL, "captions.json")
if os.path.exists(cp):
    with open(cp, encoding="utf-8") as f:
        caps = json.load(f)

items = []
for dirpath, _, files in os.walk(GAL):
    for fn in sorted(files):
        if os.path.splitext(fn)[1].lower() not in EXT:
            continue
        rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace(os.sep, "/")
        sub = os.path.relpath(dirpath, GAL)
        cat = "General" if sub == "." else sub.replace("-", " ").replace("_", " ")
        title = re.sub(r"[-_]+", " ", os.path.splitext(fn)[0]).strip().title()
        meta = caps.get(fn, {})
        items.append({
            "src": rel,
            "title": meta.get("title", title),
            "description": meta.get("description", ""),
            "year": meta.get("year", ""),
            "category": cat,
        })

items.sort(key=lambda x: (x["category"], x["src"]))
os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
with open(os.path.join(ROOT, "data", "gallery.json"), "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2, ensure_ascii=False)
print(f"gallery.json written with {len(items)} images")
