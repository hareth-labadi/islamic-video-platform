"""Render a .dc.html artboard to a static HTML preview, then screenshot it with headless Edge.

Usage: python -I render.py <board.dc.html> <width> <height> <out.png> [state-json]
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'canvas', 'assets')
BLOBS = {
    '0c346c7b3f98ff7a5385050488245350': 'logo.png',
    '3c5e1d942ce1c1f0048c82140b7eae6d': 'mark.png',
    'd4b599021b55924d799db386b8d5f5d0': 'mark-light.png',
    'd5cb4b7ab508c1a2504d8731b7bccd11': 'zellige-gold.svg',
    'de156f642dbe0f2c5d1136220702a6e7': 'zellige-light.svg',
    '8a4c97a774d8e9c59d92b7a001f152b4': 'zellige-green.svg',
    '52eae70c78ec9aa9b8bcdba7784de86a': 'markazi-arabic.woff2',
    '8f1eac6c1a406901dba040db8ff3774a': 'markazi-latin.woff2',
    '6e9a48a1161cd10e22ab44d22c17e355': 'fig-home.jpg',
    'cb7c90225b86635cdac0b652ae19238a': 'fig-videos.jpg',
    '2745ae87830f80b75101bc2696f5eb84': 'fig-search.jpg',
    'd64d361b50e60dd79432c326d42eb14d': 'fig-mobile.jpg',
}

RUNTIME = r"""
<script>
class DCLogic { constructor(p){ this.props = p || {}; this.state = {}; } setState(s){ Object.assign(this.state, typeof s === 'function' ? s(this.state) : s); } forceUpdate(){} }
function look(scope, path){ path = path.trim(); if (path === 'true') return true; if (path === 'false') return false; if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  let v = scope; for (const k of path.split('.')) { if (v == null) return undefined; v = v[k]; } return v; }
function interp(str, scope){ const m = str.match(/^\s*\{\{([^}]+)\}\}\s*$/); if (m) return look(scope, m[1]);
  return str.replace(/\{\{([^}]+)\}\}/g, (_, p) => { const v = look(scope, p); return v == null ? '' : String(v); }); }
function render(node, scope, out){
  if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.textContent, scope))); return; }
  if (node.nodeType !== 1) return;
  const tag = node.tagName.toLowerCase();
  if (tag === 'sc-for') { const list = interp(node.getAttribute('list'), scope) || []; const as = node.getAttribute('as');
    list.forEach((item, i) => { const s = Object.assign(Object.create(scope), { [as]: item, $index: i }); node.childNodes.forEach(c => render(c, s, out)); }); return; }
  if (tag === 'sc-if') { if (interp(node.getAttribute('value'), scope)) node.childNodes.forEach(c => render(c, scope, out)); return; }
  const el = document.createElementNS(node.namespaceURI, node.localName);
  for (const a of node.attributes) { if (/^on[A-Z]/.test(a.name) || a.name.startsWith('hint-')) continue; const v = interp(a.value, scope); if (v === false || v == null) continue; el.setAttribute(a.name, typeof v === 'function' ? '' : v); }
  const src = tag === 'template' ? node.content : node;
  src.childNodes.forEach(c => render(c, scope, el));
  out.appendChild(el);
}
window.addEventListener('DOMContentLoaded', () => {
  const C = new Function('DCLogic', document.getElementById('logic').textContent + '; return Component;')(DCLogic);
  const inst = new C({}); Object.assign(inst.state, STATE);
  const vals = inst.renderVals();
  const tpl = document.getElementById('tpl').content;
  const host = document.getElementById('host');
  tpl.childNodes.forEach(c => render(c, vals, host));
});
</script>
"""

def main():
    src, w, h, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), os.path.abspath(sys.argv[4])
    state = sys.argv[5] if len(sys.argv) > 5 else '{}'
    text = open(src, encoding='utf-8').read()
    local_assets = os.path.join(os.path.dirname(out), 'assets')
    os.makedirs(local_assets, exist_ok=True)
    import shutil
    for bid, fn in BLOBS.items():
        if os.path.exists(os.path.join(ASSETS, fn)):
            shutil.copyfile(os.path.join(ASSETS, fn), os.path.join(local_assets, fn))
        text = text.replace('/_blob/' + bid, 'assets/' + fn)
    html_open = re.sub(r'\sdir="[^"]*"', '', re.search(r'<html[^>]*>', text).group(0))
    helmet = re.search(r'<helmet>(.*?)</helmet>', text, re.S).group(1)
    body = re.search(r'<x-dc>(.*?)</x-dc>', text, re.S).group(1)
    body = re.sub(r'<helmet>.*?</helmet>', '', body, flags=re.S)
    logic = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', text, re.S).group(1)
    page = ('<!doctype html>' + html_open + '<head><meta charset="utf-8">' + helmet +
            '<style>*{animation-play-state:paused!important;animation-delay:-10s!important}</style>' +
            '<script>const STATE=' + state + ';</script>' + RUNTIME + '</head><body>' +
            '<template id="tpl">' + body + '</template><div id="host"></div>' +
            '<script type="text/plain" id="logic">' + logic + '</script></body></html>')
    tmp = out.replace('.png', '.preview.html')
    open(tmp, 'w', encoding='utf-8').write(page)
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    profile = os.path.join(ROOT, 'tools', 'edge-profile')
    try:
        subprocess.run([edge, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                        '--no-first-run', '--no-default-browser-check', f'--user-data-dir={profile}',
                        '--virtual-time-budget=8000', f'--window-size={w},{h}', f'--screenshot={out}', 'file:///' + tmp.replace('\\', '/')],
                       check=False, capture_output=True, timeout=60)
    except subprocess.TimeoutExpired:
        print('edge timed out')
    print('wrote', out, os.path.exists(out))

main()
