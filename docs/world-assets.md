# Gallery画像を追加する

1. 画像を `gallery-inbox/` に入れる
2. `pnpm gallery:add`
3. 画像の説明（alt）を入力する
4. `pnpm dev` で確認する
5. 問題なければ通常どおりcommit / pushする

Gallery登録情報は `src/content/gallery.json` で管理します。手でmanifestや公開ファイルを編集せず、追加・削除コマンドを使ってください。
Galleryは画像のみを表示し、作品名や場所はサイト上に表示しません。画像説明はアクセシビリティ用のaltとして使用します。

## 対応画像

- PNG / JPG / JPEG / WebP
- 横長のスクリーンショットを推奨
- 長辺が1920pxを超える画像は、比率を保ったまま自動縮小します
- WebPへ自動変換し、quality 84から800 KiBを目安に再圧縮します
- quality 76でも800 KiBを超える場合は、画質を優先して警告付きで保存します
- EXIFなどの個人情報につながるmetadataは取り除き、ICCプロファイルは色変化を抑えるため保持します
- 変換後のwidth / heightもmanifestへ保存し、画像ごとの比率を保って表示します
- 元画像はGit管理外の `gallery-archive/` へ移動します

Galleryへ登録する画像は、Celenas SMPの建築や風景として公開してよいものを選んでください。ユーザー名、チャット、座標、個人情報などが画像内に写っていないことも確認してください。

## 管理コマンド

### `pnpm gallery:add`

`gallery-inbox/` の画像を1枚選び、画像の説明（alt）を入力します。altは必須です。空の場合は「画像の説明を入力してください。」と案内して再入力を求めます。確認後、画像を最適化して `public/gallery/` に保存し、manifestの先頭へ登録します。処理に成功した元画像は `gallery-archive/` へ移動します。

同じ元画像の二重登録、ID衝突、既存WebPの上書きを防ぎます。manifest・画像処理・archive移動のどこかで失敗した場合、可能な範囲でmanifestと出力を元に戻し、元画像をinboxに残します。

### `pnpm gallery:list`

登録順に番号・ID・公開パス・alt・ファイルサイズを表示します。

### `pnpm gallery:remove`

Gallery一覧から番号で選択します。画像ファイル名で項目を識別し、確認の既定値はNoです。公開WebPとmanifest項目だけを削除し、`gallery-archive/` の元画像には触れません。公開画像が欠けているときも状態を示し、確認を得てからmanifestを変更します。

### `pnpm gallery:validate`

manifestの必須項目・重複・パス・WebPの存在とデコード可否・寸法・metadataを検証します。長辺1920px超やmanifestと公開ファイルの不一致はエラーになり、800 KiB超は警告になります。エラーがある場合は終了コード1を返し、`pnpm check` とPages deploymentを止めます。

## 保管場所

- `gallery-inbox/`: 登録前の画像置き場。`.gitkeep`以外はGit管理しません。
- `gallery-archive/`: 最適化前の元画像保管場所。ディレクトリごとGit管理外です。
- `public/gallery/`: Galleryで配信する最適化済みWebP。Git管理対象です。
- `src/content/gallery.json`: Galleryの唯一のmanifestです。`id` / `src` / `alt` / `width` / `height`を保持し、新しい項目は先頭に追加されます。

`sharp`はNode.js 24環境で使う画像変換ライブラリです。外部CLIには依存しません。
