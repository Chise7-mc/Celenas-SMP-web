# Web参加認証の設定と確認

Hero・Communityの参加リンクはJoin欄へ移動します。Google reCAPTCHA v2の
認証結果をCloudflare Pages Functionsが検証し、成功した場合だけDiscordへ
進めます。招待先は公開設定・静的HTML・クライアントバンドルへ含めません。

この対策はWebの参加導線を保護します。CAPTCHAは本人確認ではなく、すべてのbotを
排除する保証もありません。すでに共有された招待URLは直接利用できます。
Discord内の認証、招待の失効やロール変更は行いません。

## GoogleとCloudflareの設定

Googleの管理画面でreCAPTCHA v2の「私はロボットではありません」チェックボックス型を
作成し、許可ドメインに`celenas-smp.pages.dev`を登録します。サイトキーは公開可能ですが、
秘密鍵はGit・チャット・クライアントコードへ入れず、Cloudflareの秘密設定へ直接登録します。
本番と開発・プレビューのキーは分け、本番にGoogleの汎用テストキーを使用しません。

本番公開先は`https://celenas-smp.pages.dev/`です。
PagesプロジェクトのProduction環境に次を設定します。

| 名前                             | 配置                | 値                                  |
| -------------------------------- | ------------------- | ----------------------------------- |
| `DEPLOY_TARGET`                  | ビルド環境          | `cloudflare`                        |
| `NEXT_PUBLIC_SITE_URL`           | ビルド環境          | `https://celenas-smp.pages.dev/`    |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | ビルド環境          | Googleの公開サイトキー              |
| `RECAPTCHA_SECRET_KEY`           | Functionsのsecret   | Googleの秘密鍵                      |
| `JOIN_ALLOWED_ORIGIN`            | Functionsの環境変数 | `https://celenas-smp.pages.dev`     |
| `DISCORD_INVITE_URL`             | Functionsの環境変数 | 運営が確認したHTTPSのDiscord招待URL |

`GITHUB_PAGES`と`NEXT_PUBLIC_BASE_PATH`はCloudflareビルドでは設定しません。
公開サイトキー変更後には再ビルドが必要です。秘密鍵と招待先を`NEXT_PUBLIC_`変数に
入れないでください。Preview環境は本番と分け、固定のプレビューオリジンとGoogleの
許可ドメインを対応させます。未知のプレビューオリジンは許可しません。

ビルドコマンドは`pnpm build && pnpm verify:cloudflare`、静的出力先は`out`です。
`functions/`はリポジトリルートのままGit連携でデプロイします。Direct Uploadの
既存プロジェクトでは、プロジェクトルートからWranglerで静的出力とFunctionsを
一緒にデプロイします。ダッシュボードへのドラッグ＆ドロップでは`functions/`が
コンパイルされません。公開は明示的な承認後に行います。
`public/_routes.json`がFunctionの実行対象を`/api/join`に限定します。

## 動作と拒否条件

通常閲覧ではGoogleへ認証通信しません。「認証を開始する」を押した時にスクリプトを
読み込みます。Googleへの接続とプライバシーポリシー・利用規約をJoin欄に表示します。
認証前と送信中の参加申請ボタンは無効です。

APIはPOST・JSON・本文8 KiB以内・トークン4096文字以内・設定したOriginとの一致を
要求します。Googleの成功応答・hostname一致・認証画面の読み込み時刻が妥当で
未来ではないことを検証します。トークン受領後2分の期限と再利用はGoogleが判定します。
読み込みから認証完了まで2分以上かかっても、Googleが承認したトークンは拒否しません。
Google通信は5秒、クライアントの
待機は10秒で打ち切り、期限切れや失敗後は認証をやり直します。

キー未設定、JavaScript無効、Googleの遮断、API失敗でも認証を迂回しません。
未設定時は「参加認証は準備中」と表示します。APIは任意のリダイレクト先を受け付けず、
Discord招待先だけを許可します。応答はキャッシュせず、トークン・秘密鍵・IP・個人情報を
ログへ書きません。Googleの検証APIへIPを追加送信しません。

## 公開前の確認

1. `pnpm check`とCloudflare静的出力検証を通す。
2. Previewへ専用のGoogleキーとFunctions設定を入れてデプロイする。
3. デスクトップ・スマートフォンでキーボード操作、実際のGoogle認証、Discordへの
   移動を確認する。未認証、期限切れ、通信失敗、無効トークンでは招待先を返さないことも確認する。
4. 秘密鍵が静的出力へ混入せず、公開サイトキーと対応していることを確認する。
   キーやトークンをログへ出して確認しない。
5. 本番設定で再ビルドし、承認後に公開して、本番ドメインでも確認する。

自動テストは外部サービスだけをテスト側で置き換えます。実際のGoogle認証と
Cloudflare上のFunction動作はローカルテストでは保証できません。
現在の実装に分散レート制限はありません。大量のAPI呼び出しへの制限は、
使用するCloudflareサービス・契約に応じて別途運用設定を検討してください。

## 公式仕様

- [reCAPTCHA v2](https://developers.google.com/recaptcha/docs/display)
- [サーバー検証](https://developers.google.com/recaptcha/docs/verify)
- [Pages Functionsの配置](https://developers.cloudflare.com/pages/functions/get-started/)
- [Direct UploadとFunctions](https://developers.cloudflare.com/pages/get-started/direct-upload/#functions)
