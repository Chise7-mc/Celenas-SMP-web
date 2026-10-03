# Celenas SMP

Celenas SMPの公式サイトです。Minecraft Java Edition 26.3、Discord参加案内、公開ルールを掲載しています。サーバーアドレスはWebサイトで公開していません。

## 開発

Node.js 24 と pnpm 11.25.0 を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

ローカル画面は [localhost:3000](http://localhost:3000) で開きます。環境変数や認証情報は不要です。Next.jsのテレメトリはプロジェクトの実行スクリプトで無効化しています。

## Gallery画像を追加する

1. PNG / JPG / JPEG / WebP画像を `gallery-inbox/` に入れる
2. `pnpm gallery:add`
3. 画像の説明（alt）を入力する
4. `pnpm dev` で確認する
5. 問題なければ通常どおりcommit / pushする

画像は最大1920px・WebPへ自動変換されます。元画像はGit管理外の `gallery-archive/` に移動します。Galleryは `src/content/gallery.json` を唯一のデータ源として使い、サイト上では画像だけを表示します。画像の説明はアクセシビリティ用altとして使います。

```sh
pnpm gallery:list
pnpm gallery:remove
pnpm gallery:validate
```

詳しい手順と制約は [Gallery画像の管理](docs/world-assets.md) を参照してください。

## デプロイ

本番サイトは [GitHub Pages](https://chise7-mc.github.io/Celenas-SMP-web/) で公開します。`Deploy GitHub Pages` workflowが`main`へのpush時に静的エクスポートを作成・検証し、GitHub Pagesへデプロイします。Project Siteの`/Celenas-SMP-web` base pathはPages build時だけ有効です。

## 検証

```sh
pnpm exec playwright install chromium
pnpm check
```

`pnpm check`は整形、lint、型チェック、Gallery manifest検証、unit test、本番build、Playwrightを順に実行します。ブラウザテストはポート3100に専用の本番サーバーを起動します。Windowsでのブラウザ導入手順は[テスト手順](docs/testing.md)を参照してください。

## 実装状況

- Hero / About / World / Community / Rules / Gallery / Joinを備えたランディングページ
- 月明かり・軌道をモチーフにしたダークテーマと公式ロゴ
- Minecraft Java Edition 26.3、Discord招待、6項目の公開ルール
- サーバーアドレスはWeb非公開
- Galleryは画像のみを表示し、1枚の画像を登録済み
- GitHub Pages用の静的エクスポートと品質CI

## ドキュメント

- [アーキテクチャと依存関係](docs/architecture.md)
- [デザイン基盤](docs/design-system.md)
- [Gallery画像の管理](docs/world-assets.md)
- [月相の計算と表示](docs/lunar-phase.md)
- [テスト](docs/testing.md)
- [品質ゲート](docs/quality-gates.md)
- [エージェント向け作業ルール](AGENTS.md)
