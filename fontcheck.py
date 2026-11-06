import sys, os
from fontTools.ttLib import TTFont
need = "ɛɣḍḥṛṣṭẓčǧƐƔḌḤṚṢṬẒČǦ"
d = sys.argv[1]
for fn in sorted(os.listdir(d)):
    f = TTFont(os.path.join(d, fn))
    cmap = f.getBestCmap()
    missing = [c for c in need if ord(c) not in cmap]
    print(f"{fn[:-4]:22s} {'OK' if not missing else str(len(missing)) + ' missing: ' + ' '.join('U+%04X' % ord(c) for c in missing)}")
