#!/usr/bin/env python3
"""src/ と assets/ から1ファイルのゲームを作る。出力: dist/index.html"""
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(R, p), encoding='utf-8').read()
A = json.loads(read('assets/assets.json'))
icons = json.loads(read('assets/game-icons.json'))
rules, game, hero, page = read('src/rules.js'), read('src/game.js'), read('src/hero.js'), read('src/page.html')
names = set(re.findall(r"icon:'([^']+)'", rules))
names |= set(re.findall(r"TR\('[^']+','([^']+)'", rules))
missing = sorted(names - set(icons))
if missing: raise SystemExit(f'アイコンが見つかりません: {missing}')
A['icons'] = {n: icons[n] for n in names}
rules = re.sub(r"if\(typeof module.*\n", "", rules)
body = page + '<script>const A=' + json.dumps(A, ensure_ascii=False, separators=(',', ':')) + ';\n' + rules + '\n' + game + '\n' + hero + '</script>\n'
html = ('<!doctype html><html lang="ja"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>\n')
os.makedirs(os.path.join(R, 'dist'), exist_ok=True)
open(os.path.join(R, 'dist/index.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(R, 'dist/artifact.html'), 'w', encoding='utf-8').write(body)
print(f'dist/index.html {len(html)/1e6:.2f} MB')
