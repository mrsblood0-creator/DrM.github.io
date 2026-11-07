"""Exclude isolated PowerPoint pen/highlighter layers, not medical figures."""
from PIL import Image

def annotation_only(image):
    im = image.convert('RGBA')
    im.thumbnail((320, 320))
    w, h = im.size
    pixels = list(im.getdata())
    ink = {i for i, p in enumerate(pixels) if p[3] > 40}
    if not ink:
        return True
    # Genuine photographs and multicolour diagrams are retained. The problematic
    # layers are nearly transparent, with almost exclusively saturated pen ink.
    if len(ink) / (w * h) > .5:
        return False
    marker = sum(1 for i in ink if max(pixels[i][:3]) > 170 and
                 min(pixels[i][:3]) < 130 and max(pixels[i][:3])-min(pixels[i][:3]) > 100)
    if marker / len(ink) < .97:
        return False
    # All isolated pen layers, including readable handwriting, are omitted.
    return True
