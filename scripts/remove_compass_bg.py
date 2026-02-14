"""Remove dark blue background from compass sticker, keep only compass subject."""
from PIL import Image
import sys

def remove_dark_bg(input_path: str, output_path: str) -> None:
    img = Image.open(input_path).convert("RGBA")
    data = list(img.getdata())
    
    new_data = []
    for item in data:
        r, g, b, a = item
        luminance = 0.299 * r + 0.587 * g + 0.114 * b
        # Dark background: very low luminance (dark navy/black)
        # Also catch near-black and dark blue hues
        is_dark_bg = luminance < 95 and (r < 100 and g < 100)
        new_data.append((r, g, b, 0) if is_dark_bg else item)
    
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    input_p = sys.argv[1] if len(sys.argv) > 1 else "client/public/compass_sticker.png"
    output_p = sys.argv[2] if len(sys.argv) > 2 else input_p
    remove_dark_bg(input_p, output_p)
