import os
import zlib
import struct

def create_png_icon(filename, size=192, bg_color=(0, 149, 246), fg_color=(255, 255, 255)):
    """Generate a clean PWA icon PNG file directly."""
    width, height = size, size
    raw_data = bytearray()
    
    center_x, center_y = width / 2, height / 2
    inner_radius = size * 0.32
    
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            # Check if within rounded rectangle
            dx = abs(x - center_x)
            dy = abs(y - center_y)
            dist = ((x - center_x)**2 + (y - center_y)**2)**0.5
            
            # Instagram-like camera circle / icon
            if dist <= inner_radius and dist >= inner_radius - (size * 0.06):
                r, g, b = fg_color
            elif dist <= size * 0.12:
                r, g, b = fg_color
            elif dx > size * 0.22 and dx < size * 0.32 and dy > size * 0.22 and dy < size * 0.32 and x > center_x and y < center_y:
                r, g, b = fg_color
            else:
                # Gradient background (blue to purple)
                t = (x + y) / (width + height)
                r = int(0 * (1 - t) + 188 * t)
                g = int(149 * (1 - t) + 24 * t)
                b = int(246 * (1 - t) + 136 * t)
                
            raw_data.extend([r, g, b, 255])
            
    compressed = zlib.compress(bytes(raw_data), level=9)
    
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
        
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b"IHDR", ihdr))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))
    
    with open(filename, "wb") as f:
        f.write(png)

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

create_png_icon(os.path.join(static_dir, "icon-192.png"), 192)
create_png_icon(os.path.join(static_dir, "icon-512.png"), 512)
create_png_icon(os.path.join(static_dir, "apple-touch-icon.png"), 180)
print("PWA icons generated successfully!")
