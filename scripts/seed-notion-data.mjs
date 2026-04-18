/**
 * Notion CSV → Supabase seed script
 * Usage: node scripts/seed-notion-data.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lzzwrklsgwuuahxvbabl.supabase.co",
  "sb_publishable_JzqKcQWF90FjBlfpLo1xLQ_vstp-bh4"
);

// ---------- Data from Notion CSV ----------

const SUB_GOALS = [
  { position: 0, label: "1. 事業推進力" },
  { position: 1, label: "2. PdM力" },
  { position: 2, label: "3. マネジメント力" },
  { position: 3, label: "4. マインドセット" },
  { position: 4, label: "5. パフォーマンス" },
  { position: 5, label: "6. デザイン・UX理解" },
  { position: 6, label: "7. ポジション・評価の向上" },
  { position: 7, label: "8. 知識・スキルの拡張" },
];

// KDI No. "X-Y" → sub_goal position = X-1, task position = Y-1
// Tasks with 習慣化 keywords → type "habit"
const TASKS = [
  // 1. 事業推進力
  { no: "1-1", label: "全事業のビジョン〜KDIまで一貫整理・数値目標設定・デイリー確認環境構築", deadline: "2026-02-28", type: "achieve" },
  { no: "1-2", label: "主要SNSのアルゴリズム特性・マーケトレンドの情報収集環境整備", deadline: "2026-04-30", type: "achieve" },
  { no: "1-3", label: "開発・マーケIssue毎週5件以上起票を継続", deadline: "2026-04-30", type: "habit" },
  { no: "1-4", label: "基本書4冊読破（起業の科学/イシューから/良い戦略悪い戦略/解像度を上げる）", deadline: "2026-07-31", type: "achieve" },
  { no: "1-5", label: "事業成功事例100件分析・要因整理・施策活用", deadline: "2026-10-31", type: "achieve" },
  { no: "1-6", label: "社員の非生産的・定型業務時間を全事業10%以下に", deadline: "2026-09-30", type: "achieve" },
  { no: "1-7", label: "競合・市場・事例の自動集約→事業判断に使える状態構築", deadline: "2026-07-31", type: "achieve" },
  { no: "1-8", label: "クライアント満足度平均3.5点以上を安定維持", deadline: "2026-12-31", type: "achieve" },

  // 2. PdM力
  { no: "2-1", label: "小城note読破・要点を自分の言葉で説明", deadline: "2026-05-31", type: "achieve" },
  { no: "2-2", label: "プロダクト詳細指標の日次確認・分析環境整備", deadline: "2026-06-30", type: "achieve" },
  { no: "2-3", label: "新サービスのスクショ分析を毎営業日3件以上継続", deadline: "2026-04-30", type: "habit" },
  { no: "2-4", label: "PdM基本書4冊読破（プロダクトマネジメント/Lean Startup/SCRUM/Web技術）", deadline: "2026-08-31", type: "achieve" },
  { no: "2-5", label: "技術領域・選定観点を理解し技術選定議論に参加可能に", deadline: "2026-10-31", type: "achieve" },
  { no: "2-6", label: "PdM業務での生成AI活用テンプレ整備・毎週1件反映", deadline: "2026-05-31", type: "habit" },
  { no: "2-7", label: "自分のみでサービス1つ設計〜実装〜リリース完了", deadline: "2026-12-31", type: "achieve" },
  { no: "2-8", label: "FE試験に合格（模試でも可）", deadline: "2026-12-31", type: "achieve" },

  // 3. マネジメント力
  { no: "3-1", label: "チームwevox点数90点以上を3ヶ月連続維持", deadline: "2026-09-30", type: "achieve" },
  { no: "3-2", label: "チーム高負荷常態化を防ぐ仕組み構築・継続", deadline: "2026-06-30", type: "achieve" },
  { no: "3-3", label: "チーム全員で規則違反0を3ヶ月連続達成", deadline: "2026-06-30", type: "achieve" },
  { no: "3-4", label: "マネジメント基本書4冊読破（マネジメント基本/プロマネ/HIGH OUTPUT/人を動かす）", deadline: "2026-10-31", type: "achieve" },
  { no: "3-5", label: "週1回以上メンバーへの成果直結FB・同一指摘繰返し20%以下", deadline: "2026-08-31", type: "habit" },
  { no: "3-6", label: "コーチング/1on1/FB等の外部講座・資格を1つ修了", deadline: "2026-11-30", type: "achieve" },
  { no: "3-7", label: "メンバーの作業系業務稼働割合5%以下に", deadline: "2026-09-30", type: "achieve" },
  { no: "3-8", label: "チームメンバー360度評価平均で四半期成長率120%達成", deadline: "2026-12-31", type: "achieve" },

  // 4. マインドセット
  { no: "4-1", label: "マインドチェックリストを毎営業日確認・日次振返り記録を習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "4-2", label: "発言・意思決定前に「言い訳でないか」自己チェック習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "4-3", label: "アウトプット前に「コンパッションが低くないか」確認習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "4-4", label: "タスクリストを毎営業日見直し「最大限やり切る内容か」確認習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "4-5", label: "毎日日記（感情・事実・課題・次の行動）を記録する習慣化", deadline: "2026-01-31", type: "habit" },
  { no: "4-6", label: "経営者発信（note/X等）毎日3件確認・要点1行メモ習慣化", deadline: "2026-08-31", type: "habit" },
  { no: "4-7", label: "フィードバックをFBリストに追加→行動習慣に組込み・同じ指摘繰返しなし", deadline: "2026-05-31", type: "habit" },
  { no: "4-8", label: "指定書籍4冊読了（7つの習慣/愛するということ/人を動かす/ファスト&スロー）", deadline: "2026-07-31", type: "achieve" },

  // 5. パフォーマンス
  { no: "5-1", label: "週4回以上の運動を習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "5-2", label: "業務時間内の業務完了を習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "5-3", label: "食事のルーティンを確立", deadline: "2026-01-31", type: "habit" },
  { no: "5-4", label: "個人・PJタスク管理表を毎週金曜に最新化", deadline: "2026-02-28", type: "habit" },
  { no: "5-5", label: "毎日15分間の瞑想を習慣化", deadline: "2026-01-31", type: "habit" },
  { no: "5-6", label: "飲酒を週3回までに抑える", deadline: "2026-03-31", type: "habit" },
  { no: "5-7", label: "日次・週次・月次ルーティンの完全習慣化", deadline: "2026-06-30", type: "habit" },
  { no: "5-8", label: "精神疾患との付き合い方確立・支障なし状態", deadline: "2026-09-30", type: "achieve" },

  // 6. デザイン・UX理解
  { no: "6-1", label: "UI/UX基礎知識整理・判断時参照できる要点まとめ作成", deadline: "2026-05-31", type: "achieve" },
  { no: "6-2", label: "Goodpatch Blog等を毎営業日確認・学び1メモ以上習慣化", deadline: "2026-07-31", type: "habit" },
  { no: "6-3", label: "基本書4冊読破（ノンデザイナーズ/UIデザイン教科書/UI必携/UXライティング）", deadline: "2026-10-31", type: "achieve" },
  { no: "6-4", label: "LP指定書籍2冊読了（売れるLP改善/LPデザインメソッド）", deadline: "2026-08-31", type: "achieve" },
  { no: "6-5", label: "バナー指定書籍2冊読了（バナーデザインのきほん/ネット広告打ち手大全）", deadline: "2026-11-30", type: "achieve" },
  { no: "6-6", label: "トンマナ・配色・タイポグラフィ基礎を体系学習→判断基準運用", deadline: "2026-11-30", type: "achieve" },
  { no: "6-7", label: "Google UX Design Professional Certificate修了", deadline: "2026-12-31", type: "achieve" },
  { no: "6-8", label: "UI/UX事例1000件以上収集・各要点メモ", deadline: "2026-12-31", type: "achieve" },

  // 7. ポジション・評価の向上
  { no: "7-1", label: "月次・四半期目標を開始前に設定完了を徹底", deadline: "2026-12-31", type: "habit" },
  { no: "7-2", label: "現状JDと将来JDを言語化・上司と合意", deadline: "2026-01-31", type: "achieve" },
  { no: "7-3", label: "日報で昇格要件に基づく振返り習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "7-4", label: "毎週金曜にグレード要件振返り・改善策洗出し習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "7-5", label: "毎週金曜に360度評価振返り・改善策洗出し習慣化", deadline: "2026-02-28", type: "habit" },
  { no: "7-6", label: "3月評価3.6以上", deadline: "2026-03-31", type: "achieve" },
  { no: "7-7", label: "6月評価4.0以上", deadline: "2026-06-30", type: "achieve" },
  { no: "7-8", label: "12月評価4.5以上", deadline: "2026-12-31", type: "achieve" },

  // 8. 知識・スキルの拡張
  { no: "8-1", label: "生成AI主要ツールの特性把握・業務活用判断可能に", deadline: "2026-04-30", type: "achieve" },
  { no: "8-2", label: "Web3基礎（用語・仕組み・リスク）を押さえ判断ミスなし水準に", deadline: "2026-03-31", type: "achieve" },
  { no: "8-3", label: "経営知識基本書4冊読破（ファイナンス/決算書/ビジネスモデル/THE MODEL）", deadline: "2026-12-31", type: "achieve" },
  { no: "8-4", label: "行動経済学指定書籍3冊読了（最強の学問/ずる/予想どおりに不合理）", deadline: "2026-11-30", type: "achieve" },
  { no: "8-5", label: "法務・契約基礎インプット→法的リスクに気づける状態に", deadline: "2026-10-31", type: "achieve" },
  { no: "8-6", label: "個人情報・情報セキュリティ基礎→重大事故回避判断可能に", deadline: "2026-11-30", type: "achieve" },
  { no: "8-7", label: "人事労務基礎→運用リスクに気づける状態に", deadline: "2026-12-31", type: "achieve" },
  { no: "8-8", label: "会計・税務の最低限→致命的ミスをしない状態に", deadline: "2026-12-31", type: "achieve" },
];

async function main() {
  // 1. Get or create user
  const STORAGE_KEY = "mandala_user_id";
  // We need a userId - let's check if one exists or prompt
  // For simplicity, use the first user_profile or create one
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id")
    .limit(1);

  let userId;
  if (profiles && profiles.length > 0) {
    userId = profiles[0].id;
    console.log(`Using existing user: ${userId}`);
  } else {
    const id = crypto.randomUUID();
    await supabase.from("user_profiles").insert({ id });
    userId = id;
    console.log(`Created user: ${userId}`);
  }

  // 2. Create chart
  const { data: chart, error: chartErr } = await supabase
    .from("charts")
    .insert({
      user_id: userId,
      name: "2026 KPI&KDI",
      theme: "2026年 目標",
    })
    .select()
    .single();
  if (chartErr) throw chartErr;
  console.log(`Created chart: ${chart.id}`);

  // 3. Create sub_goals
  const sgRows = SUB_GOALS.map((sg) => ({
    chart_id: chart.id,
    position: sg.position,
    label: sg.label,
  }));
  const { data: sgs, error: sgErr } = await supabase
    .from("sub_goals")
    .insert(sgRows)
    .select();
  if (sgErr) throw sgErr;
  console.log(`Created ${sgs.length} sub_goals`);

  // Build sgId map: position → id
  const sgMap = {};
  for (const sg of sgs) {
    sgMap[sg.position] = sg.id;
  }

  // 4. Create tasks
  const taskRows = TASKS.map((t) => {
    const [sgNum, tNum] = t.no.split("-").map(Number);
    const sgPosition = sgNum - 1; // 1-based → 0-based
    const taskPosition = tNum - 1;
    return {
      sub_goal_id: sgMap[sgPosition],
      position: taskPosition,
      label: t.label,
      type: t.type,
      deadline: t.deadline,
      status: "active",
    };
  });

  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .insert(taskRows)
    .select();
  if (tErr) throw tErr;
  console.log(`Created ${tasks.length} tasks`);

  console.log("\nDone! Open http://localhost:3002 and select '2026 KPI&KDI' chart.");
  console.log(`User ID for localStorage: ${userId}`);
}

main().catch(console.error);
