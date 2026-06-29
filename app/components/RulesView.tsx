"use client";

import { useState } from "react";

/* ---------- 2026 基本方針 / マイルール / ルーティン ---------- */

const POLICIES: { title: string; body: string }[] = [
  {
    title: "① 決めたことを、曖昧に終わらせない",
    body: "やると決めたことから逃げず、先送りせず、最後まで向き合う。放置やフェードアウトはしない。途中でやめるなら、理由を言語化し、次の行動を必ず決める。",
  },
  {
    title: "② 自分だけではできないことを自覚し、周りを巻き込める状態をつくる",
    body: "やれることを増やすために、自分一人で完結しない前提で物事を考える。そのために、発信や人付き合いを避けず、巻き込みやすい状態に自分を置く。閉じた状態を選ばない。",
  },
  {
    title: "③ 自分の癖を自覚した上で、人に誠実に接する",
    body: "気分が態度に出やすいこと／自分の話をしがちなこと／自分を大きく見せる癖が、人との関係に悪影響を与えやすいと理解しておく。自分のペースを押し付けず、相手がどう感じるかを基準に行動する。相手が喜ぶこと、安心できることを選ぶ。",
  },
  {
    title: "④ 思いつきで動かず、人生を計画で進める",
    body: "タスクも約束も、思い出して対応しない。先に考え、先に終わらせる。場当たりで生きない。",
  },
  {
    title: "⑤ 伝えるべきことは、きちんと伝える",
    body: "報告・連絡・相談を後回しにしない。良いことも悪いことも、早めに共有する。黙ることで済ませない。",
  },
];

const GOALS: { head: string; items: string[] }[] = [
  {
    head: "1. 自立（自分との約束を守る自分になる）",
    items: [
      "言い訳でルールや目標を変えない",
      "決めたことを守れなかった／自分に変わらなくなった、を繰り返さない",
      "自分を変えることを今年の人生テーマとしてやり切る",
    ],
  },
  {
    head: "2. 音楽家としてステップアップ（音楽を主体的に進め、巻き込む）",
    items: [
      "音楽を主体的に進める（その場の流れ任せにしない）",
      "レベルの高い音楽家として呼ばれる状態を目指す",
      "日々の練習・曲の事前準備を徹底し、バンドの目標を前に進めて周りを巻き込む",
    ],
  },
  {
    head: "3. 公の場で「見られる自分」を磨く（外に出る前提の整備）",
    items: [
      "アーティストとしての身だしなみ／清潔感／見え方を整える（ホワイトニング・肌含む）",
      "体重管理・体調管理・パフォーマンス管理を徹底する",
      "SNS更新頻度を上げる／維持し、場への参加を増やして人脈を広げる",
    ],
  },
];

const ROUTINES: { head: string; items: string[] }[] = [
  {
    head: "生活関係",
    items: [
      "毎日日記を書く",
      "毎日10分間の瞑想を行う",
      "毎日最低10分は体を動かす",
      "毎日体重を測定する",
      "毎日LINE等の連絡を確認し、必要な対応を行う",
      "25:00就寝、5:00起床を守る（変な時間に寝ない）",
      "火・木・土は必ず掃除を行う（掃除／掃除機がけ／着た服を片付ける）",
      "週4回ジムに通う",
      "週4日は休肝日にする",
      "平日は会食以外で飲酒しない",
      "一人では飲酒しない",
      "ライブに誘われたら、週3本を超えない限り必ず参加する",
    ],
  },
  {
    head: "音楽関係",
    items: [
      "週2回、自主練の時間を確保する",
      "週2回、音楽制作または理論学習の時間をつくる",
      "月1回以上、ジャムセッションに参加する",
      "演奏動画を月1本投稿する",
    ],
  },
  {
    head: "仕事（学習）関係",
    items: [
      "タスク管理シートを週2回（水曜・土曜）更新する",
      "X（旧Twitter）を毎日投稿する",
      "ライブやイベントがあったら、InstagramとXに投稿する",
      "仕事関連のNote記事を月2本投稿する",
      "YouTubeチャンネルの収益化を進める（止めない）",
    ],
  },
  {
    head: "投資・お金関係",
    items: [
      "週1回以上、読書を行う",
      "IPOは必ず購入する",
      "支払いはクレジットカードを基本とする",
      "月の生活費は15万円以内に収める（旅行・楽器など大きな出費は対象外）",
    ],
  },
];

/* ---------- 仕事（Work）: 前提（長期目標）/ 2026基本方針 ---------- */

const WORK_KGI: { head: string; body: string }[] = [
  {
    head: "超長期（〜2037年3月 / 40歳まで）",
    body: "自分の作った事業で「日本人（仮）誰もが知っている」「ポジティブな」実績を作る",
  },
  {
    head: "長期（〜2032年3月 / 30代前半）",
    body: "好きな環境で、好きな仕事をできている状態を作る。家族・音楽・仕事を、誰にも余計な負荷をかけず両立できている",
  },
  {
    head: "中期（〜2027年3月 / 20代・仕事）",
    body: "外資系企業の部長レベルのスキルを完備し、役割を全うする",
  },
];

const WORK_POLICIES: { title: string; body: string }[] = [
  {
    title: "① 判断や施策は、数値・構造・前提を言語化できるものだけを進める",
    body: "方向性や感覚ではなく、なぜそれをやるのか／何が変わるのか／どこで失敗と判断するのかを説明できる状態で着手する。説明できない判断はしない。",
  },
  {
    title: "② 施策は「最後までやり切れる設計」になってから動かす",
    body: "実行・検証・振り返りまで含めて、途中で止まらない形に分解できたものだけを走らせる。やらない判断も含めて、意思決定を曖昧に残さない。",
  },
  {
    title: "③ 自分が抜けても成立する形で、事業とチームを設計する",
    body: "自分の頑張りや把握量で回る状態を前提にしない。役割・判断点・情報の流れが分かれた構造を作り、属人化を避ける。",
  },
  {
    title: "④ 人への関わりは「行動と成果が変わるか」で選ぶ",
    body: "気遣いや納得感より、次の行動が変わるか／成果につながるかを基準に関わり方を決める。注意・任せる・引き上げる判断を先延ばしにしない。",
  },
  {
    title: "⑤ 知識や情報は、次の判断を速く・正確にするものだけを取り入れる",
    body: "学んだ結果、判断が迷わなくなるか／選択肢を比較できるようになるかを基準に取捨選択する。使いどころが想定できない知識は追わない。",
  },
];

/* ---------- UI ---------- */

const CARD: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d3e3d2",
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(46,158,79,0.08)",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 mt-5 text-sm"
      style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 700, color: "#1f6d39" }}
    >
      {children}
    </h2>
  );
}

function Accordion({
  head,
  items,
  defaultOpen,
}: {
  head: string;
  items: string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={CARD} className="mb-2 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px]"
        style={{ fontWeight: 700, color: "#2c3a2e" }}
      >
        <span>{head}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2e9e4f"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="space-y-1.5 px-4 pb-3.5 pt-0.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: "#3a4a3c" }}>
              <span style={{ color: "#3aaf5b", flexShrink: 0 }}>•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={CARD} className="mb-2 px-4 py-3">
      <p className="text-[13px]" style={{ fontWeight: 700, color: "#1f6d39" }}>{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "#3a4a3c" }}>{body}</p>
    </div>
  );
}

function Toggle({ value, onChange }: { value: "private" | "work"; onChange: (v: "private" | "work") => void }) {
  const opts: { k: "private" | "work"; label: string }[] = [
    { k: "private", label: "プライベート" },
    { k: "work", label: "仕事" },
  ];
  return (
    <div className="mb-3 flex gap-1 rounded-xl p-1" style={{ background: "#e3efe3" }}>
      {opts.map((o) => {
        const active = value === o.k;
        return (
          <button
            key={o.k}
            onClick={() => onChange(o.k)}
            className="flex-1 rounded-lg py-1.5 text-[13px] transition"
            style={{
              fontFamily: "'Zen Maru Gothic', sans-serif",
              fontWeight: active ? 700 : 500,
              color: active ? "#1f6d39" : "#6a7a6c",
              background: active ? "#ffffff" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(46,158,79,0.18)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RulesView() {
  const [view, setView] = useState<"private" | "work">("private");
  return (
    <div>
      <div
        className="mb-3 rounded-2xl px-4 py-4"
        style={{ background: "linear-gradient(135deg,#3aaf5b,#2e9e4f)", color: "#fff" }}
      >
        <p className="text-[11px]" style={{ opacity: 0.9 }}>2026年</p>
        <h1 className="text-base" style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 700 }}>
          {view === "private" ? "基本方針・マイルール・ルーティン" : "前提・基本方針（仕事）"}
        </h1>
      </div>

      <Toggle value={view} onChange={setView} />

      {view === "private" ? (
        <>
          <SectionTitle>基本方針</SectionTitle>
          {POLICIES.map((p, i) => (
            <PolicyCard key={i} title={p.title} body={p.body} />
          ))}

          <SectionTitle>今年のプライベート目標</SectionTitle>
          {GOALS.map((g, i) => (
            <Accordion key={i} head={g.head} items={g.items} defaultOpen={i === 0} />
          ))}

          <SectionTitle>今年のルーティン</SectionTitle>
          {ROUTINES.map((r, i) => (
            <Accordion key={i} head={r.head} items={r.items} defaultOpen={i === 0} />
          ))}
        </>
      ) : (
        <>
          <SectionTitle>前提（長期目標 / KGI）</SectionTitle>
          {WORK_KGI.map((k, i) => (
            <div key={i} className="mb-2 px-4 py-3" style={{ ...CARD, borderLeft: "4px solid #2e9e4f" }}>
              <p className="text-[11px]" style={{ color: "#7a8a7c", fontWeight: 700 }}>{k.head}</p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "#2c3a2e", fontWeight: 600 }}>{k.body}</p>
            </div>
          ))}

          <SectionTitle>2026 基本方針</SectionTitle>
          {WORK_POLICIES.map((p, i) => (
            <PolicyCard key={i} title={p.title} body={p.body} />
          ))}
        </>
      )}
    </div>
  );
}
