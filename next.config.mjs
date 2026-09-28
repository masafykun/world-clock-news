/** @type {import("next").NextConfig} */
// ⚠️ images.remotePatterns は 2026-08-24 に削除した。
//    `hostname: "**"` はあらゆるホストを許可する設定で、
//    /_next/image?url=... 経由で任意のURLをサーバに取りに行かせられる（SSRF）。
//    内部宛（127.0.0.1 や 169.254.169.254）も文法上は通るため危険。
//    next/image は1箇所も使っていなかったので、設定ごと外した。
//    将来 next/image を使うときは、**実際に必要なホストだけ**を書き足すこと。
//    ワイルドカードに戻さないこと。
const nextConfig = {};

export default nextConfig;
