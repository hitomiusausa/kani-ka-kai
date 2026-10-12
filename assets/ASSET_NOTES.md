# サンプル素材の出所

2026-10-12。内蔵 `image_gen` を使用。CLI/API課金の経路は使用していない。

## 承認画面

`concepts/kani-ka-kai-approved-no-window.png` は会話で生成し、ひちゃんが採用した窓なしの画面案。元ファイルは Downloads に維持。ゲームに画面全体を貼り付けてはいない。

## カニの表情

出力：`public/assets/characters/crab-expressions.png`（パスはプロジェクトルート基準）。透明背景の2×2シート。

参照は承認済み画面案。中間シートのセル間隔を再調整し、最終シートをプロジェクトにコピー。元画像のファイルは上書きしていない。実行時に透明余白の範囲を読み取り、4フレームの共通スケールと底中央の基準を合わせて表示する。

最初の生成プロンプト：

> Create a production game sprite sheet from the crab character in this reference image. Transparent background. Square canvas, exactly 2 columns by 2 rows of equal square cells, four isolated full crabs, one per cell, no text, no guides, no environment, no UI, no counter. Each crab must occupy exactly the same relative place and scale inside its cell, centered horizontally with the bottom feet at 85% of cell height. Leave safe margins. Preserve the original wide squat red-orange layered torn-paper crab with two small tall eye stalks, sleepy sideways-looking eyes, tiny nearly straight mouth, little angular feet, asymmetrical claws with the larger claw raised on viewer right. Handmade warm muted vermilion paper, mottled fibers, subdued colors, finely cut paper edges. Same character, same palette, facing direction, silhouette, body size in all four frames. Do not redesign into a cute cartoon. Top left = original neutral deadpan expression and raised right claw. Top right = successful selection: right claw pinched shut, mouth tiny round opening for blowing a bubble, otherwise same body and eyes. Bottom left = 'oh dear' expression: both eyelids lowered a little further, eyes glance toward the viewer, mouth slightly slanted, same body and claw pose. Bottom right = reward: both pupils look to viewer right, a tiny knowing straight smile, same body and claw pose. No bubble drawn in the asset; bubbles will be animated separately. Crab body must stay stable between frames. The sheet is a technical set of four consistent fixed-cell sprites, not a poster.

最終編集プロンプト（参照：上記の中間シート）：

> Fix sprite sheet spacing only. Keep exactly these four original paper crabs and their expressions in this 2x2 square grid. Scale each crab down to 75% of its current size inside its own cell, keeping the same scale for all crabs, centered in its cell. Each crab including every claw and foot must fit completely inside its own quadrant with a clear 12% transparent margin on left and right. Preserve the complete original character and paper detail. Top left neutral, top right mouth blowing and pinched claw, bottom left tired annoyed half-closed eyelids, bottom right looking to its right. Align all bodies and feet at identical relative positions inside each equal square cell. Transparent background everywhere outside crabs. No labels, guides, frames, text or background. No crab or limb touches another cell or the image edge. Output a square four-cell sprite sheet.

## その他

紙の背景・札・袋・鍋・絵札・波はこのプロジェクトでCSS/SVGとして作成。波は3枚の色紙形状にSVGの粒子フィルターを重ねたもの。完成料理は下記の画像素材に更新。短い効果音はWeb Audioで合成。音声読み上げはブラウザ/OSの音声機能。外部のフォント・画像・音楽をダウンロードする実装はない。

PICO PARKは設計の参考のみ。素材・音・コードを流用していない。

## 2026-10-13：扉の貝

出力：`public/assets/characters/shell-paper.png`。参照は承認済みの窓なし画面案。内蔵 `image_gen`、透明背景指定。生成原本を維持してコピー。扉と大きなお題で使用し、札内のシンプルな絵は維持。

> Create ONE isolated scallop seashell illustration as a game title-screen asset. Use the crab in the reference solely as the reference for handmade paper collage medium: irregular hand-cut colored paper, visible but gentle fibrous texture, subtle mottled pigment, overlapping layered paper planes with tiny shadows. The subject is ONLY a large simple fan-shaped scallop shell seen from the front, upright, gently asymmetrical scalloped rim, five to seven radial ridges built from separate cut-paper wedges. Restrained muted dusty taupe, gray mauve, sand and warm ivory, harmonious with the reference's red-orange crab and cream background. Give the shell a quiet peculiar charm through uneven handmade shapes. No face, eyes, crab, props, words, icons, background, border, scene, UI, realistic photographic gloss or watercolor background. Transparent background. Entire shell visible, centered with 12 percent transparent margin all around. Silhouette recognizable at a glance. This will be the large companion to the existing crab on a minimal title page. Landscape 4:3 composition, one shell only.

## 2026-10-13：秘密の料理

出力：`public/assets/characters/secret-dish-paper.png`。同じ承認画面を質感の参照に使用。内蔵 `image_gen`、透明背景指定。生成原本を維持してコピー。料理名と絵は完成演出で初めて表示し、湯気はCSSで加える。

> Create an isolated handmade cut-paper collage illustration for the secret reward in a small strange game. One warm ivory oval plate holding TWO golden brown crab cream croquettes, one whole oblong croquette and one broken open to reveal delicious warm ivory cream with a few tiny muted brick red crab flecks. A few tiny scraps of ochre paper represent crisp breadcrumbs. Food should look very appetizing but entirely constructed from irregular hand-cut layered matte colored paper with mottled pigment and gentle fibrous texture, like the crab in the reference. Restrained muted ochre, warm golden brown, cream and very small brick red accents. Viewed at a slight angle from above, compact centered composition, very simple. No crab character, utensils, vegetables, scenery, text or border. No glossy photorealism. No drawn outline. No steam: steam will be animated separately. TRANSPARENT BACKGROUND, entire plate visible with transparent margin. Landscape 3:2 composition. This is the only illustrated subject.

## 2026-10-13：集めた材料5つ

内蔵 `image_gen` を1素材につき1回使用。参照は承認済み窓なし画面の紙の質感・配色。透明背景の原本を維持して、プロジェクトへコピーした。

- `public/assets/ingredients/flour.png`：粉の見える小麦粉の袋と麦の絵
- `public/assets/ingredients/egg.png`：卵と割れた殻
- `public/assets/ingredients/crumbs.png`：パン粉の入った器
- `public/assets/ingredients/oil.png`：油の瓶
- `public/assets/ingredients/claw.png`：カニ爪

完全な生成プロンプト5本は [`ingredient-prompts.json`](ingredient-prompts.json)。UIに表示する文字は画像に焼き付けず、DOM側で表示。カニ本体の既存素材は変更していない。レシピブックでは既存の料理・カニと新しい材料を組み合わせて表示する。
