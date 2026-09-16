import fitz
import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="lm-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFA463" />
      <stop offset="100%" stop-color="#BD521E" />
    </linearGradient>
    <linearGradient id="lm-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFBD8A" />
      <stop offset="100%" stop-color="#E26628" />
    </linearGradient>
    <linearGradient id="lm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181A20" />
      <stop offset="100%" stop-color="#0A0B0E" />
    </linearGradient>
  </defs>
  <!-- Full dark container for maskable / home screen icons -->
  <rect width="64" height="64" fill="url(#lm-bg)"/>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="#4A2A1A" stroke-width="1.5" opacity="0.6"/>
  <!-- Iconic Mining Crystal / Lead Discovery Hex-Prism -->
  <!-- Top facet -->
  <path d="M32 11 L49 24 L32 33 L15 24 Z" fill="url(#lm-grad-accent)" />
  <!-- Left facet -->
  <path d="M15 24 L32 33 L32 53 L15 39 Z" fill="url(#lm-grad-main)" opacity="0.85" />
  <!-- Right facet -->
  <path d="M49 24 L32 33 L32 53 L49 39 Z" fill="url(#lm-grad-accent)" />
  <!-- Center beacon core -->
  <path d="M32 21 L39 28 L32 37 L25 28 Z" fill="#FFF4EC" opacity="0.95" />
</svg>"""

pub_dir = os.path.join(os.path.dirname(__file__), "..", "public")

sizes = [
    (192, os.path.join(pub_dir, "icon-192.png")),
    (512, os.path.join(pub_dir, "icon-512.png")),
    (180, os.path.join(pub_dir, "apple-touch-icon.png")),
]

for size, file_path in sizes:
    doc = fitz.open("svg", svg_content.encode("utf-8"))
    page = doc[0]
    zoom = size / 64.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(file_path)
    print(f"Generated {file_path}: {pix.width}x{pix.height}")

