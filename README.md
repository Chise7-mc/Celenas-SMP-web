# Celenas SMP

Celenas の公開 Web v1 ランディングページです。現在の実装では、
Hero / About / World / Server / Rules / Gallery / Join / Footer を備えた
ダークな月夜テーマのサイトを提供し、未確定のサーバー情報や画像は
pending state として明示します。

## 開発

Node.js 24 と pnpm 11.25.0 を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

ローカル画面は [localhost:3000](http://localhost:3000) で開きます。
環境変数や認証情報は不要です。Next.js のテレメトリはプロジェクトの実行
スクリプトで無効化しています。

## 検証

```sh
pnpm exec playwright install chromium
pnpm check
```

`check` は整形、lint、型チェック、ユニットテスト、本番ビルド、Playwright を
順に実行します。ブラウザテストはポート 3100 に専用の本番サーバーを起動します。
Windows のブラウザ導入コマンドなど、詳細は [テスト手順](docs/testing.md) を参照してください。

## 実装状況

- Web v1 ランディングページを実装済み
- Hero / About / World / Server / Rules / Gallery / Join / Footer を含む
- 月明かりと軌道をモチーフにした、控えめな Liquid Glass ナビゲーションと操作表現
- 公式ロゴ `public/brand/celenas-logo-white.png` をヘッダーと Hero で使用
- 編集コピーは `src/content/home.ts`、確認済みの接続情報は `src/config/site.ts` で管理
- 実スクリーンショット未掲載時は意図的な Gallery pending 表示。画像の追加手順は `docs/world-assets.md`
- 未確定の公開情報は `src/config/site.ts` の `null` / optional で保持
- 本番環境で使うサーバーアドレス、ドメイン、Discord URL、Minecraft スクリーンショットは未確定
- サーバー状態APIやライブ監視は未実装

## 構成

- Next.js App Router / React / strict TypeScript
- CSS Custom Properties によるデザイントークン
- Vitest / React Testing Library / Playwright / axe
- ESLint / Prettier / GitHub Actions

参加情報は `src/config/site.ts` で管理し、未確定値は `null` のまま表示します。
架空のアドレス・バージョン・Discord URL は使用しません。確認済みの公開情報を
設定した後、再ビルドしてください。秘密情報や個人情報は置かないでください。

## ドキュメント

- [アーキテクチャと依存関係の判断](docs/architecture.md)
- [デザイン基盤](docs/design-system.md)
- [テスト](docs/testing.md)
- [品質ゲート](docs/quality-gates.md)
- [実装記録と計画](docs/phase-1-plan.md)
- [エージェント向け作業ルール](AGENTS.md)

## 現在の状態

確認済みの参加情報、管理者承認済みルール、本番の Minecraft スクリーンショット、
サーバーの live status と最終ドメインは未確定のままです。Web v1 の基礎実装は
完了しており、未確認の情報は意図的に pending として表示しています。
