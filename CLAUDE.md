# mandala-kdi — マンダラ＋KDI管理ツール

> 上位の `~/workspace/CLAUDE.md` と `~/CLAUDE.md` を継承。ここは本アプリ固有。

## 役割
ユタのキャリア目標（マンダラチャート：KGI → KPI×8 → KDI×8）を管理・日次運用するための自作Webアプリ。
目標データの正本は `~/.claude/goals/career-yuta-2026.md`（詳細）＋ `career-yuta-2026-summary.md`（要約）。**本アプリはそれを画面で運用するための実装**。

## スタック
- Next.js 14.2 (App Router) / React 18 / TypeScript
- UI: shadcn + @base-ui/react + Tailwind + lucide-react
- データ: **Supabase (Postgres) が正本**。状態管理は自前hook `lib/useAppData.ts`（専用ライブラリなし）
- 認証: Supabase Auth（`app/login`, `app/auth/callback`）

## 構成
- `app/page.tsx` — SPA的タブ切替: 今日 / 年間(Timeline) / チャート / KDI / 実績(Stats)
- `app/components/` — TodayView, TimelineView, ChartView, KdiView, StatsView, AuthProvider, Modal
- `lib/db.ts` — `charts` 等テーブルのCRUD（マンダラ＝chartsテーブル）
- `supabase/migrations/` — RLS有効化 / KDI頻度(once)等
- `scripts/seed-notion-data.mjs` — **データ投入はNotion由来**（seedスクリプト）

## キャリア目標との連携メモ
- 目標mdの宿題「TSVインポート形式の調整」は**現状の実装と不一致**。実データ取込みは TSV ではなく `seed-notion-data.mjs`（Notion→Supabase）経由。インポート方式を議論するときはこのスクリプトとchartsスキーマを起点にする
- KDIの頻度・習慣化ルール（daily週6/平日週4・weekly3週連続）は目標md「習慣化の達成基準」と整合させる。マイグレーションに頻度概念あり（`kdi_freq_once`）

## 開発時の注意
- 開発確認は **localhost:3000**（ブラウザで確認）
- Supabaseスキーマ変更は `supabase/migrations/` にマイグレーション追加。RLS前提を崩さない
- commit/pushはユーザー明示時のみ
