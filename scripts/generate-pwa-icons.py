import subprocess
import os
import shutil
from PIL import Image

def generate_icons():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pub_dir = os.path.join(root_dir, 'public')
    scripts_dir = os.path.join(root_dir, 'scripts')
    svg_path = os.path.join(pub_dir, 'favicon.svg')

    # Ensure icon.svg is synced with favicon.svg
    shutil.copyfile(svg_path, os.path.join(pub_dir, 'icon.svg'))

    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_raw = f.read()

    # 1024x1024 master canvas for crisp downsampling
    html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1024px; height: 1024px; overflow: hidden; background: transparent; }}
svg {{ width: 1024px; height: 1024px; display: block; }}
</style>
</head>
<body>
{svg_raw}
</body>
</html>'''

    temp_html = os.path.join(scripts_dir, 'temp_render.html')
    master_png = os.path.join(scripts_dir, 'temp_master_1024.png')

    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    edge_paths = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    ]
    browser_bin = next((p for p in edge_paths if os.path.exists(p)), None)
    if not browser_bin:
        raise RuntimeError("No Chromium browser (Edge or Chrome) found for SVG rendering.")

    cmd = [
        browser_bin,
        '--headless',
        '--screenshot=' + master_png,
        '--window-size=1024,1024',
        '--default-background-color=00000000',
        '--hide-scrollbars',
        'file:///' + temp_html.replace('\\', '/')
    ]
    subprocess.run(cmd, check=True)

    img1024 = Image.open(master_png).convert('RGBA')

    targets = [
        (512, os.path.join(pub_dir, 'icon-512.png')),
        (192, os.path.join(pub_dir, 'icon-192.png')),
        (180, os.path.join(pub_dir, 'apple-touch-icon.png')),
    ]

    for size, target_path in targets:
        resized = img1024.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(target_path, 'PNG', optimize=True)
        print(f'Generated {os.path.basename(target_path)} ({size}x{size}): {os.path.getsize(target_path)} bytes')

    # Cleanup temp render files
    for p in [temp_html, master_png]:
        if os.path.exists(p):
            os.remove(p)

if __name__ == '__main__':
    generate_icons()

