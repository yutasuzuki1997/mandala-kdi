/**
 * 2026 プライベート曼荼羅（7/1スタート / H2）seed
 * 既存の「2026 KPI&KDI」(職務版) はそのまま、別チャートとして追加する。
 * Usage: node scripts/seed-2026-private.mjs
 *
 * ※ KDIセルは「2026基本方針＋ルーティン＋2025プライベートチャート」を元にしたドラフト。
 *   投入後、アプリのチャート画面で内容・期限を自由に修正する前提。
 */
import { createClient } from "@supabase/supabase-js";

// RLSが有効なため service_role キーで投入する（RLSバイパス）。
// 実行: SUPA_SERVICE_KEY=<service_roleキー> node scripts/seed-2026-private.mjs
//   キーは Supabase Dashboard → Settings → API → service_role secret
const SUPABASE_URL = "https://lzzwrklsgwuuahxvbabl.supabase.co";
const SERVICE_KEY = process.env.SUPA_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error("環境変数 SUPA_SERVICE_KEY（Supabaseのservice_roleキー）を設定してください。");
  console.error("例: SUPA_SERVICE_KEY=eyJ... node scripts/seed-2026-private.mjs");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CHART = {
  name: "2026 プライベート",
  theme: "パートナーと共に、持続可能で幸せな環境を作る",
};

const SUB_GOALS = [
  { position: 0, label: "1. 音楽家として実力をつける" },
  { position: 1, label: "2. 彩りある生活を送る" },
  { position: 2, label: "3. JiggyBeatsの安定・個人音楽活動の始動" },
  { position: 3, label: "4. 知名度をつける" },
  { position: 4, label: "5. アートで起業する計画を整える" },
  { position: 5, label: "6. 魅力的な人間になる" },
  { position: 6, label: "7. 人間関係を安定させる" },
  { position: 7, label: "8. 経済的な余裕を作る" },
];

// KDI No. "X-Y" → sub_goal position = X-1, task position = Y-1
// 期限は 7/1スタートの後半期 (2026-07〜12) に配分
const TASKS = [
  // 1. 音楽家として実力をつける
  { no: "1-1", label: "週2回の自主練を習慣化する（後半期継続）", deadline: "2026-09-30", type: "habit" },
  { no: "1-2", label: "週2回、音楽制作または理論学習の時間をつくる", deadline: "2026-09-30", type: "habit" },
  { no: "1-3", label: "ジャムセッションに参加する", deadline: "2026-12-31", type: "habit",
    kdi: { label: "ジャムセッション参加", freq: "monthly", target: 1 } },
  { no: "1-4", label: "演奏動画を投稿する", deadline: "2026-12-31", type: "habit",
    kdi: { label: "演奏動画の投稿", freq: "monthly", target: 1 } },
  { no: "1-5", label: "フレーズをコピーする（月25・後半期計150）", deadline: "2026-12-31", type: "achieve",
    kdi: { label: "フレーズコピー", freq: "monthly", target: 25 } },
  { no: "1-6", label: "オリジナル曲を制作する（月1・後半期計6）", deadline: "2026-12-31", type: "achieve",
    kdi: { label: "オリジナル曲制作", freq: "monthly", target: 1 } },
  { no: "1-7", label: "作編曲の基礎理論を段階学習する（①基礎和声→②コード進行/リハモ→③編曲実践で1曲）", deadline: "2026-10-31", type: "achieve" },
  { no: "1-8", label: "基礎練メニューを確立し定着させる", deadline: "2026-09-30", type: "achieve" },

  // 2. 彩りある生活を送る
  { no: "2-1", label: "毎日日記を書く", deadline: "2026-07-31", type: "habit" },
  { no: "2-2", label: "毎日10分間の瞑想を行う", deadline: "2026-07-31", type: "habit" },
  { no: "2-3", label: "音楽ライブ・舞台を観に行く（月2本）", deadline: "2026-09-30", type: "habit",
    kdi: { label: "ライブ観覧", freq: "monthly", target: 2 } },
  { no: "2-4", label: "月2本以上映画を観る", deadline: "2026-12-31", type: "habit" },
  { no: "2-5", label: "月1回以上お笑いのライブ・舞台を観に行く", deadline: "2026-12-31", type: "habit" },
  { no: "2-6", label: "芸術学習書3冊を読破（①西洋・日本美術史の基本 ②続・西洋・日本美術史の基本 ③現代アート辞典）", deadline: "2026-10-31", type: "achieve" },
  { no: "2-7", label: "その他学習書3冊を読破（①経済学入門ミクロ ②経済学入門マクロ ③地政学）", deadline: "2026-11-30", type: "achieve",
    kdi: { label: "読書（その他学習書3冊）", freq: "monthly", target: 1 } },
  { no: "2-8", label: "英語学習を日常会話レベルまで進める", deadline: "2026-12-31", type: "achieve" },

  // 3. JiggyBeatsの安定・個人音楽活動の始動
  { no: "3-1", label: "JiggyBeatsの方針を策定し、メンバーに理解してもらう", deadline: "2026-07-31", type: "achieve" },
  { no: "3-2", label: "オリジナル曲を1曲制作・1曲レコーディングする", deadline: "2026-12-31", type: "achieve" },
  { no: "3-3", label: "鈴木名義でオリジナルを1曲作曲する", deadline: "2026-09-30", type: "achieve" },
  { no: "3-4", label: "バンドのタスク管理ページを作り、全て一元管理できるようにする", deadline: "2026-07-31", type: "achieve" },
  { no: "3-5", label: "ゴリラ向けのオリジナル曲を制作完了する", deadline: "2026-07-31", type: "achieve" },
  { no: "3-6", label: "オリジナルのコンボ曲を制作する（月2曲・計8曲）", deadline: "2026-10-31", type: "achieve",
    kdi: { label: "コンボ曲制作", freq: "monthly", target: 2 } },
  { no: "3-7", label: "JiggyのSNS更新を安定化する（週1投稿）", deadline: "2026-09-30", type: "habit",
    kdi: { label: "Jiggy SNS投稿", freq: "weekly", target: 4 } },
  { no: "3-8", label: "コンボの初ライブの日程を確定させる", deadline: "2026-10-31", type: "achieve" },

  // 4. 知名度をつける
  { no: "4-1", label: "仕事用X・プライベートXの両方を毎日投稿する", deadline: "2026-07-31", type: "habit" },
  { no: "4-2", label: "仕事関連のNote記事を月2本投稿する（習慣化）", deadline: "2026-10-31", type: "habit" },
  { no: "4-3", label: "ライブ・イベント時はInstagramとXに必ず投稿する", deadline: "2026-08-31", type: "habit" },
  { no: "4-4", label: "Threads・LinkedIn・YOUTRUST・Facebookの運用方針を確定する", deadline: "2026-07-31", type: "achieve" },
  { no: "4-5", label: "InstagramフォロワーをH2で+2,000増やす", deadline: "2026-12-31", type: "achieve" },
  { no: "4-6", label: "X（ビジネス/アーティスト）フォロワーをH2で+2,000増やす", deadline: "2026-12-31", type: "achieve" },
  { no: "4-7", label: "Xの更新を自動化する", deadline: "2026-07-31", type: "achieve" },
  { no: "4-8", label: "Noteの更新を自動化する", deadline: "2026-10-31", type: "achieve" },

  // 5. アートで起業する計画を整える
  { no: "5-1", label: "アート起業の基本書5冊を読破（①ブランディングの教科書 ②はじまりのアートマネジメント ③芸術とその対象 ④芸術の売り方 ⑤想像力なき日本）", deadline: "2026-12-31", type: "achieve",
    kdi: { label: "読書（アート起業基本書5冊）", freq: "monthly", target: 1 } },
  { no: "5-2", label: "エンタメ業界の主要数値・市場規模を把握・整理する", deadline: "2026-09-30", type: "achieve" },
  { no: "5-3", label: "事業アイデアの仮説を3つ立て検証する", deadline: "2026-11-30", type: "achieve" },
  { no: "5-4", label: "大きな企画を1つ以上試す", deadline: "2026-12-31", type: "achieve" },
  { no: "5-5", label: "業界のキーパーソン・メジャー知人を5人作る", deadline: "2026-12-31", type: "achieve" },
  { no: "5-6", label: "法人化に向けた要件・コストを整理する", deadline: "2026-10-31", type: "achieve" },
  { no: "5-7", label: "月1回以上、起業・事業構想の時間を確保する", deadline: "2026-12-31", type: "habit" },
  { no: "5-8", label: "競合・成功事例を毎週リサーチしメモする", deadline: "2026-08-31", type: "habit" },

  // 6. 魅力的な人間になる
  { no: "6-1", label: "週4回ジムに通う", deadline: "2026-07-31", type: "habit" },
  { no: "6-2", label: "毎日体重を測定する", deadline: "2026-07-31", type: "habit" },
  { no: "6-3", label: "毎日最低10分は体を動かす", deadline: "2026-07-31", type: "habit" },
  { no: "6-4", label: "体重を段階的に落とす（7月末80kg→8月末76kg→9月末74kg→10月末72kg）", deadline: "2026-10-31", type: "achieve" },
  { no: "6-5", label: "ホワイトニングを完了する", deadline: "2026-12-31", type: "achieve" },
  { no: "6-6", label: "25:00就寝・5:00起床の生活リズムを習慣化する", deadline: "2026-08-31", type: "habit" },
  { no: "6-7", label: "免許を取得する", deadline: "2026-12-31", type: "achieve" },
  { no: "6-8", label: "いかなる理由でも悪口を言わない", deadline: "2026-07-31", type: "habit" },

  // 7. 人間関係を安定させる
  { no: "7-1", label: "週2回以上パートナーと夕飯を一緒に食べる", deadline: "2026-07-31", type: "habit" },
  { no: "7-2", label: "週1人以上と会食をする", deadline: "2026-07-31", type: "habit" },
  { no: "7-3", label: "LINE等の連絡を毎日確認し必要な対応を行う", deadline: "2026-07-31", type: "habit" },
  { no: "7-4", label: "重要な連絡は睡眠時以外1時間以内に返答する", deadline: "2026-07-31", type: "habit" },
  { no: "7-5", label: "大事な連絡は電話かボイスメモを必ず使う", deadline: "2026-07-31", type: "habit" },
  { no: "7-6", label: "結婚式までの進行計画を決める", deadline: "2026-09-30", type: "achieve" },
  { no: "7-7", label: "月1回パーティーを開く（8月〜）", deadline: "2026-12-31", type: "habit",
    kdi: { label: "パーティー開催", freq: "monthly", target: 1, start: "2026-08-01" } },
  { no: "7-8", label: "月1回以上、新しい友人・人脈を作る", deadline: "2026-12-31", type: "habit" },

  // 8. 経済的な余裕を作る
  { no: "8-1", label: "個人の出費を月15万円以内に収める", deadline: "2026-09-30", type: "habit",
    kdi: { label: "個人出費15万円以内", freq: "monthly", target: 1 } },
  { no: "8-2", label: "完全自動化収入を月20万円作る（7月末1万→9月末5万→11月末10万→年末20万）", deadline: "2026-12-31", type: "achieve" },
  { no: "8-3", label: "家庭の出費（家賃・水道光熱費・食費）を月30万円以内に抑える", deadline: "2026-12-31", type: "habit" },
  { no: "8-4", label: "じぶん銀行の貯金を100万円に戻す", deadline: "2026-12-31", type: "achieve" },
  { no: "8-5", label: "投資運用スタイルを確立し定期積立を継続する", deadline: "2026-12-31", type: "habit" },
  { no: "8-6", label: "母の事業を月商40万円以上に成長させる", deadline: "2026-12-31", type: "achieve" },
  { no: "8-7", label: "IPOは必ず購入する", deadline: "2026-12-31", type: "habit" },
  { no: "8-8", label: "サブスクを月3万円以内に抑える", deadline: "2026-07-31", type: "habit" },
];

async function main() {
  // user_id は既存チャート（職務版）の所有者＝アプリのログインユーザーを再利用する。
  // 必要なら SUPA_EMAIL でauthユーザーから解決（service_roleのadmin API）。
  let userId;
  const { data: existing } = await supabase
    .from("charts")
    .select("user_id")
    .limit(1);
  if (existing && existing.length > 0) {
    userId = existing[0].user_id;
    console.log(`Reusing existing chart owner as user_id: ${userId}`);
  } else if (process.env.SUPA_EMAIL) {
    const { data: list, error: lErr } = await supabase.auth.admin.listUsers();
    if (lErr) throw lErr;
    const u = list.users.find((x) => x.email === process.env.SUPA_EMAIL);
    if (!u) throw new Error(`auth user not found for ${process.env.SUPA_EMAIL}`);
    userId = u.id;
    console.log(`Resolved user_id from email: ${userId}`);
  } else {
    throw new Error("user_idを解決できません。SUPA_EMAIL を指定するか、既存チャートが必要です。");
  }
  await supabase.from("user_profiles").upsert({ id: userId });

  const { data: chart, error: chartErr } = await supabase
    .from("charts")
    .insert({ user_id: userId, name: CHART.name, theme: CHART.theme })
    .select()
    .single();
  if (chartErr) throw chartErr;
  console.log(`Created chart: ${chart.id} (${CHART.name})`);

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

  const sgMap = {};
  for (const sg of sgs) sgMap[sg.position] = sg.id;

  const taskRows = TASKS.map((t) => {
    const [sgNum, tNum] = t.no.split("-").map(Number);
    return {
      sub_goal_id: sgMap[sgNum - 1],
      position: tNum - 1,
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

  // task (sub_goal_id, position) → id
  const taskMap = {};
  for (const t of tasks) taskMap[`${t.sub_goal_id}:${t.position}`] = t.id;

  // 5. Create KDI trackers (monthly等の追跡カウンター)
  const kdiRows = TASKS.filter((t) => t.kdi).map((t) => {
    const [sgNum, tNum] = t.no.split("-").map(Number);
    const taskId = taskMap[`${sgMap[sgNum - 1]}:${tNum - 1}`];
    return {
      task_id: taskId,
      user_id: userId,
      label: t.kdi.label,
      freq: t.kdi.freq,
      target_per_month: t.kdi.target ?? null,
      threshold: 90,
      start_date: t.kdi.start ?? "2026-07-01",
      deadline: t.deadline,
    };
  });
  if (kdiRows.length) {
    const { data: kdis, error: kErr } = await supabase
      .from("kdis")
      .insert(kdiRows)
      .select();
    if (kErr) throw kErr;
    console.log(`Created ${kdis.length} kdis`);
  }

  console.log("\nDone! Open http://localhost:3002 and select '2026 プライベート' chart.");
}

main().catch(console.error);
