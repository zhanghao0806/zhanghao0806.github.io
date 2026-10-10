"""Create and validate per-article Songti webfonts; full OTFs remain build-only."""
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


def is_cjk(character):
    point = ord(character)
    return (0x3400 <= point <= 0x9FFF or 0xF900 <= point <= 0xFAFF
            or 0x20000 <= point <= 0x323AF)


jobs = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for job in jobs:
    for style in job["outputs"]:
        font = TTFont(job["sources"][style], recalcTimestamp=False)
        cmap = font.getBestCmap()
        missing = sorted({char for char in job["text"] if is_cjk(char) and ord(char) not in cmap})
        if missing:
            raise ValueError(f'{job["article"]}: 源宋体缺少这些汉字：{"".join(missing)}')

        options = subset.Options()
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
        options.name_languages = ["*"]
        options.notdef_glyph = True
        options.notdef_outline = True
        options.recommended_glyphs = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text=job["text"])
        subsetter.subset(font)

        # The source license reserves its original name; name the derivative independently.
        names = {1: "Article Songti", 2: style, 3: f"ArticleSongti-{style}-{job['fingerprint']}",
                 4: f"Article Songti {style}", 6: f"ArticleSongti-{style}",
                 16: "Article Songti", 17: style}
        for record in font["name"].names:
            if record.nameID in names:
                font["name"].setName(names[record.nameID], record.nameID,
                                     record.platformID, record.platEncID, record.langID)
        if "CFF " in font:
            font["CFF "].cff.fontNames = [f"ArticleSongti-{style}"]
            top = font["CFF "].cff.topDictIndex[0]
            top.FamilyName = "Article Songti"
            top.FullName = f"Article Songti {style}"

        expected = {ord(char) for char in job["text"] if ord(char) in cmap}
        if expected - set(font.getBestCmap()):
            raise ValueError(f'{job["article"]}: 裁剪后字体丢失字符')
        font.flavor = "woff2"
        font.save(job["outputs"][style])
        font.close()
    print(f'已裁剪：{job["article"]}', flush=True)
