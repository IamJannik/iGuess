"""
rename_svg_flags.py
--------------------
Geht einen Ordner durch und benennt SVG-Dateien um,
deren Name aus Unicode-Hex-Codepoints besteht (z.B. 1F1E9-1F1EA.svg)
→ in den entsprechenden Unicode-Text (z.B. 🇩🇪.svg oder DE.svg).

Verwendung:
    python rename_svg_flags.py <ordner> [--text]

    --text   → Dateiname wird als ASCII-Text (z.B. "DE") gespeichert
               statt als echtes Emoji-Zeichen.
               Ohne --text → Emoji direkt im Dateinamen (z.B. 🇩🇪.svg).

Beispiele:
    python rename_svg_flags.py ./flags
    python rename_svg_flags.py ./flags --text
"""

import os
import sys
import argparse


def hex_to_emoji(filename_stem: str) -> str | None:
    """
    Wandelt '1F1E9-1F1EA' → '🇩🇪' (echtes Emoji).
    Gibt None zurück, wenn der Name kein valider Hex-Codepoint-String ist.
    """
    parts = filename_stem.split("-")
    try:
        chars = [chr(int(p, 16)) for p in parts]
        return "".join(chars)
    except ValueError:
        return None


def emoji_to_text(emoji: str) -> str:
    """
    Versucht, Regional-Indicator-Symbole (Flaggen-Emoji) in
    ASCII-Buchstaben umzuwandeln.
    Regional Indicators: U+1F1E6 (A) bis U+1F1FF (Z)
    """
    result = []
    for ch in emoji:
        cp = ord(ch)
        if 0x1F1E6 <= cp <= 0x1F1FF:
            result.append(chr(cp - 0x1F1E6 + ord("a")))
        else:
            # Kein Regional Indicator → Hex-Darstellung als Fallback
            result.append(f"U{cp:04X}")
    return "".join(result)


def rename_svgs(folder: str, use_text: bool = False, dry_run: bool = False):
    folder = os.path.abspath(folder)
    if not os.path.isdir(folder):
        print(f"❌ Ordner nicht gefunden: {folder}")
        sys.exit(1)

    files = [f for f in os.listdir(folder) if f.lower().endswith(".svg")]
    if not files:
        print("Keine SVG-Dateien gefunden.")
        return

    renamed = 0
    skipped = 0

    for filename in sorted(files):
        stem = os.path.splitext(filename)[0]
        emoji = hex_to_emoji(stem)

        if emoji is None:
            print(f"  ⏭  Übersprungen (kein Hex-Name): {filename}")
            skipped += 1
            continue

        new_stem = emoji_to_text(emoji) if use_text else emoji
        new_name = new_stem + ".svg"
        old_path = os.path.join(folder, filename)
        new_path = os.path.join(folder, new_name)

        if old_path == new_path:
            print(f"  ✔  Bereits korrekt: {filename}")
            skipped += 1
            continue

        if os.path.exists(new_path):
            print(f"  ⚠  Ziel existiert schon, überspringe: {new_name}")
            skipped += 1
            continue

        print(f"  {'[DRY]' if dry_run else '✅'} {filename}  →  {new_name}")
        if not dry_run:
            os.rename(old_path, new_path)
        renamed += 1

    print(f"\nFertig: {renamed} umbenannt, {skipped} übersprungen.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Benennt SVG-Flaggen-Dateien von Hex-Codepoints in Unicode-Text um."
    )
    parser.add_argument("ordner", help="Pfad zum SVG-Ordner")
    parser.add_argument(
        "--text",
        action="store_true",
        help="Verwende ASCII-Text (z.B. DE) statt Emoji-Zeichen im Dateinamen",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Zeigt nur an, was umbenannt würde – ändert nichts",
    )
    args = parser.parse_args()

    rename_svgs(args.ordner, use_text=args.text, dry_run=args.dry_run)
