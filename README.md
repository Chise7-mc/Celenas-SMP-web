# Celenas SMP

Celenas SMPの公式サイトです。Minecraft Java Edition 26.3、Discord参加案内、公開ルールを掲載しています。サーバーアドレスはWebサイトで公開していません。

## 開発

Node.js 24 と pnpm 11.25.0 を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

ローカル画面は [localhost:3000](http://localhost:3000) で開きます。閲覧に認証情報は不要です。参加導線にはreCAPTCHAとCloudflare Pages Functionsの設定が必要です。キー未設定時は参加認証を準備中として表示します。Next.jsのテレメトリはプロジェクトの実行スクリプトで無効化しています。

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

本番サイトは [Cloudflare Pages](https://celenas-smp.pages.dev/) です。`DEPLOY_TARGET=cloudflare`と公開URLを指定し、`pnpm build && pnpm verify:cloudflare`で静的出力を作成・検証します。出力先は`out`、認証APIはルートの`functions/`です。設定と公開手順は[参加認証の設定](docs/join-security.md)を参照してください。

既存のGitHub Pages workflowは静的出力を公開しますが、そこでは参加認証APIは動作しません。本番の参加導線はCloudflare側で確認してください。

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
- Galleryは画像のみを横スライド表示し、5枚の画像を登録済み
- Cloudflare Pages用の静的エクスポート、参加導線のreCAPTCHA検証APIと品質CI

## ドキュメント

- [アーキテクチャと依存関係](docs/architecture.md)
- [デザイン基盤](docs/design-system.md)
- [Gallery画像の管理](docs/world-assets.md)
- [月相の計算と表示](docs/lunar-phase.md)
- [テスト](docs/testing.md)
- [品質ゲート](docs/quality-gates.md)
- [参加認証の設定と確認](docs/join-security.md)
- [エージェント向け作業ルール](AGENTS.md)
