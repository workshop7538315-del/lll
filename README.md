# トリマナ戦記

キャラクリして、3マナのカードで移動と攻撃を行うマス目タクティクス。

- ビルド: `python3 tools/build.py`（`dist/index.html` が1ファイルで動く）
- バランス確認: `node tools/sim.js`（AI同士の到達分布）
- カード、敵、ステージのデータ: `src/rules.js`
- 画面と演出: `src/game.js`、`src/page.html`
- 素材の取り込みスクリプト: `tools/asset-pipeline/`（`assets/assets.json` を作ったもの）

## ライセンス

素材はそれぞれのライセンスに従います。ゲーム内の「素材クレジット」に作者一覧があります。

| 用途 | 素材 | ライセンス |
|---|---|---|
| キャラ、敵 | [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) | CC-BY-SA / GPL など（パーツごと） |
| マップ | [love2d-lpc-tiles](https://github.com/DrJamgo/love2d-lpc-tiles) 収録の LPC タイル | CC-BY-SA 3.0 / GPL 3.0 |
| UI | [Kenney UI Pack Adventure](https://github.com/lpfd/kenney-uipack) | CC0 |
| カード絵 | [game-icons.net](https://game-icons.net/) | CC BY 3.0 |
| フォント | DotGothic16 | SIL OFL |
