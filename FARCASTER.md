# Farcaster Mini App 対応メモ（Nameless Pulse / 非言語サポーターアプリ そよぎ | Soyogi）

公開URL: https://maimmaim20230728-blip.github.io/soyogi-supporter-web/

- index.html: fc:miniapp メタタグ（＋旧互換 fc:frame）
- index.html </body>直前: Farcaster内のみ esm.sh から @farcaster/miniapp-sdk を読込み sdk.actions.ready()（通常時は読込まず軽量維持）
- icons/farcaster-embed.png: 3:2 埋め込みカード画像
- .well-known/farcaster.json: Mini App manifest（未署名）
- service-worker.js: v2 -> v3

## 残作業（ユーザー）
1. manifest署名: https://farcaster.xyz/~/developers/mini-apps/manifest で accountAssociation 追記（FID必要）
2. ドメイン直下制約: github.io サブパスではカード表示＆起動は可・追加/通知/発見は独自ドメイン要
3. 検証: https://farcaster.xyz/~/developers/mini-apps/embed に公開URLを貼る
