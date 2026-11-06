"""Print the last row (y) that differs from the page background colour."""
import sys
from PIL import Image

img = Image.open(sys.argv[1]).convert('RGB')
w, h = img.size
bg = img.getpixel((2, h - 2))
px = img.load()
for y in range(h - 1, -1, -1):
    if any(sum(abs(a - b) for a, b in zip(px[x, y], bg)) > 12 for x in range(0, w, 3)):
        print(sys.argv[1], 'content bottom:', y, 'of', h)
        break
