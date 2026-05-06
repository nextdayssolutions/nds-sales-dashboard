/**
 * Dev 専用テストユーザーの検出ヘルパー。
 *
 * dev 用のクイックログインユーザーは本番 DB を共有して使う前提なので、
 * email を `@nds.test` ドメインで識別し、本番ビルドの管理画面・KPI から除外する。
 *
 * 仕様:
 *   - production ビルド (NODE_ENV === "production"): [DEV] ユーザーを完全に隠す
 *   - dev ビルド: 全ユーザーを表示（管理・削除・確認できるよう）
 */

export function isDevTestEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@nds.test");
}

/** 本番ビルドでは true → dev ユーザーを除外する */
export function shouldHideDevTestUsers(): boolean {
  return process.env.NODE_ENV === "production";
}
