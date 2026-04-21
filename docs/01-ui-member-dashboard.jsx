import { useState, useEffect } from "react";

// ============================================================
// MOCK DATA
// ============================================================
const CUSTOMERS = [
  { id: 1, name: "株式会社テックフロンティア", industry: "IT", contact: "山田 太郎", products: ["SFA Pro", "MA Basic"], relation: 8, lastContact: "2026-04-15", revenue: 2400000, status: "既存" },
  { id: 2, name: "グローバルネット株式会社", industry: "通信", contact: "佐藤 花子", products: ["ERP Suite"], relation: 6, lastContact: "2026-04-10", revenue: 5800000, status: "既存" },
  { id: 3, name: "ファーストリテール株式会社", industry: "小売", contact: "鈴木 一郎", products: ["POS Cloud"], relation: 4, lastContact: "2026-03-28", revenue: 1200000, status: "商談中" },
  { id: 4, name: "メディカルソリューション株式会社", industry: "医療", contact: "高橋 美咲", products: ["SFA Pro", "CRM Light"], relation: 9, lastContact: "2026-04-17", revenue: 3600000, status: "既存" },
  { id: 5, name: "コンストラクション株式会社", industry: "建設", contact: "田中 誠", products: [], relation: 3, lastContact: "2026-04-01", revenue: 0, status: "見込み" },
  { id: 6, name: "フィンテック株式会社", industry: "金融", contact: "伊藤 由紀", products: ["ERP Suite", "MA Basic"], relation: 7, lastContact: "2026-04-12", revenue: 4200000, status: "既存" },
];

const PRODUCTS = ["SFA Pro", "MA Basic", "ERP Suite", "POS Cloud", "CRM Light"];

const MONTHLY_REVENUE = [
  { month: "1月", target: 5000000, actual: 4800000 },
  { month: "2月", target: 5000000, actual: 5200000 },
  { month: "3月", target: 5500000, actual: 6100000 },
  { month: "4月", target: 5500000, actual: 3200000 },
  { month: "5月", target: 5500000, actual: 0 },
  { month: "6月", target: 6000000, actual: 0 },
  { month: "7月", target: 6000000, actual: 0 },
  { month: "8月", target: 6000000, actual: 0 },
  { month: "9月", target: 6500000, actual: 0 },
  { month: "10月", target: 6500000, actual: 0 },
  { month: "11月", target: 6500000, actual: 0 },
  { month: "12月", target: 7000000, actual: 0 },
];

const PRODUCT_REVENUE = [
  { name: "SFA Pro", q1: 3200000, q2: 2800000, q3: 0, q4: 0, color: "#00D4FF" },
  { name: "ERP Suite", q1: 5600000, q2: 1200000, q3: 0, q4: 0, color: "#7B5EA7" },
  { name: "MA Basic", q1: 1800000, q2: 600000, q3: 0, q4: 0, color: "#00E5A0" },
  { name: "POS Cloud", q1: 900000, q2: 600000, q3: 0, q4: 0, color: "#FFB830" },
  { name: "CRM Light", q1: 600000, q2: 0, q3: 0, q4: 0, color: "#FF6B6B" },
];

const TRAINING_PROGRAMS = [
  {
    id: 1, category: "営業スキル", title: "ソリューション営業マスター",
    progress: 75, total: 12, completed: 9,
    items: [
      { name: "顧客ヒアリング技法", done: true },
      { name: "提案書作成スキル", done: true },
      { name: "クロージング戦略", done: true },
      { name: "オブジェクションハンドリング", done: true },
      { name: "価格交渉術", done: true },
      { name: "マルチステークホルダー対応", done: true },
      { name: "ROI提示の技術", done: true },
      { name: "競合比較プレゼン", done: true },
      { name: "リファレンスセリング", done: true },
      { name: "アップセル・クロスセル", done: false },
      { name: "エグゼクティブアポイント", done: false },
      { name: "パートナー営業連携", done: false },
    ]
  },
  {
    id: 2, category: "製品知識", title: "製品認定資格プログラム",
    progress: 60, total: 5, completed: 3,
    items: [
      { name: "SFA Pro 認定", done: true },
      { name: "ERP Suite 認定", done: true },
      { name: "MA Basic 認定", done: true },
      { name: "POS Cloud 認定", done: false },
      { name: "CRM Light 認定", done: false },
    ]
  },
  {
    id: 3, category: "マネジメント", title: "リーダーシップ開発",
    progress: 33, total: 6, completed: 2,
    items: [
      { name: "チームビルディング基礎", done: true },
      { name: "1on1 ミーティング技術", done: true },
      { name: "目標設定と評価", done: false },
      { name: "コーチング技法", done: false },
      { name: "プレゼンテーション上級", done: false },
      { name: "変革マネジメント", done: false },
    ]
  },
  {
    id: 4, category: "デジタル", title: "デジタルセールス変革",
    progress: 50, total: 8, completed: 4,
    items: [
      { name: "SNSセリング基礎", done: true },
      { name: "LinkedIn活用術", done: true },
      { name: "オンライン商談スキル", done: true },
      { name: "セールスアナリティクス", done: true },
      { name: "AI活用セールス", done: false },
      { name: "マーケティングオートメーション連携", done: false },
      { name: "CRM最大活用", done: false },
      { name: "データドリブン営業", done: false },
    ]
  },
];

const SCHEDULE_EVENTS = [
  { id: 1, date: "2026-04-19", time: "09:00", title: "株式会社テックフロンティア 定例MTG", type: "meeting", customer: "株式会社テックフロンティア" },
  { id: 2, date: "2026-04-19", time: "14:00", title: "フィンテック株式会社 提案プレゼン", type: "presentation", customer: "フィンテック株式会社" },
  { id: 3, date: "2026-04-21", time: "10:00", title: "コンストラクション株式会社 初回商談", type: "meeting", customer: "コンストラクション株式会社" },
  { id: 4, date: "2026-04-22", time: "13:00", title: "SFA Pro認定試験", type: "training", customer: null },
  { id: 5, date: "2026-04-23", time: "11:00", title: "メディカルソリューション QBR", type: "presentation", customer: "メディカルソリューション株式会社" },
  { id: 6, date: "2026-04-24", time: "15:00", title: "社内営業戦略会議", type: "internal", customer: null },
  { id: 7, date: "2026-04-25", time: "09:30", title: "グローバルネット 更新交渉", type: "meeting", customer: "グローバルネット株式会社" },
];

// ============================================================
// HELPERS
// ============================================================
const fmt = (n) => n === 0 ? "—" : `¥${(n / 10000).toFixed(0)}万`;
const fmtFull = (n) => `¥${n.toLocaleString()}`;

const RelationDots = ({ value }) => (
  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%",
        background: i < value
          ? value >= 8 ? "#00E5A0" : value >= 5 ? "#00D4FF" : "#FFB830"
          : "rgba(255,255,255,0.1)",
        transition: "background 0.3s"
      }} />
    ))}
    <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{value}/10</span>
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6, width: "100%", overflow: "hidden" }}>
    <div style={{
      width: `${(value / max) * 100}%`, height: "100%",
      background: color, borderRadius: 4,
      transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
    }} />
  </div>
);

const CircleProgress = ({ value, size = 80, stroke = 7, color = "#00D4FF" }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ── CRM Panel ──────────────────────────────────────────────
function CRMPanel() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("全て");
  const statuses = ["全て", "既存", "商談中", "見込み"];

  const filtered = filter === "全て" ? CUSTOMERS : CUSTOMERS.filter(c => c.status === filter);

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 16, height: "100%" }}>
      {/* List */}
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "5px 14px", borderRadius: 20, border: "1px solid",
              borderColor: filter === s ? "#00D4FF" : "rgba(255,255,255,0.15)",
              background: filter === s ? "rgba(0,212,255,0.12)" : "transparent",
              color: filter === s ? "#00D4FF" : "rgba(255,255,255,0.5)",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit"
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              style={{
                padding: "14px 16px", borderRadius: 12,
                background: selected?.id === c.id ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selected?.id === c.id ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer", transition: "all 0.2s"
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{c.contact} · {c.industry}</div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11,
                  background: c.status === "既存" ? "rgba(0,229,160,0.15)" : c.status === "商談中" ? "rgba(255,184,48,0.15)" : "rgba(255,255,255,0.08)",
                  color: c.status === "既存" ? "#00E5A0" : c.status === "商談中" ? "#FFB830" : "rgba(255,255,255,0.5)"
                }}>{c.status}</span>
              </div>
              <RelationDots value={c.relation} />
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div style={{
          padding: 20, borderRadius: 16,
          background: "rgba(0,212,255,0.04)",
          border: "1px solid rgba(0,212,255,0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>担当: {selected.contact}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "業界", value: selected.industry },
              { label: "ステータス", value: selected.status },
              { label: "最終接触", value: selected.lastContact },
              { label: "年間売上", value: fmt(selected.revenue) },
            ].map(item => (
              <div key={item.label} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>関係値スコア</div>
            <RelationDots value={selected.relation} />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>導入済み商材</div>
            {selected.products.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.products.map(p => (
                  <span key={p} style={{
                    padding: "4px 10px", borderRadius: 8, fontSize: 12,
                    background: "rgba(0,212,255,0.12)", color: "#00D4FF",
                    border: "1px solid rgba(0,212,255,0.25)"
                  }}>{p}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>未導入</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Schedule Panel ─────────────────────────────────────────
function SchedulePanel() {
  const today = "2026-04-19";
  const typeColors = {
    meeting: { bg: "rgba(0,212,255,0.12)", text: "#00D4FF", label: "商談" },
    presentation: { bg: "rgba(123,94,167,0.2)", text: "#B794F4", label: "提案" },
    training: { bg: "rgba(0,229,160,0.12)", text: "#00E5A0", label: "研修" },
    internal: { bg: "rgba(255,184,48,0.12)", text: "#FFB830", label: "社内" },
  };

  const byDate = {};
  SCHEDULE_EVENTS.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const dates = [...new Set(SCHEDULE_EVENTS.map(e => e.date))].sort();

  return (
    <div>
      <div style={{
        padding: "10px 14px", borderRadius: 10, marginBottom: 20,
        background: "rgba(255,184,48,0.08)", border: "1px solid rgba(255,184,48,0.2)",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFB830", flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          Googleカレンダー連携 — 本番環境では <span style={{ color: "#FFB830" }}>Google Calendar API</span> と接続してください
        </div>
      </div>

      {dates.map(date => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: date === today ? "#00D4FF" : "rgba(255,255,255,0.5)"
            }}>
              {date === today ? "▶ 今日" : ""} {date}
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byDate[date].map(ev => {
              const tc = typeColors[ev.type];
              return (
                <div key={ev.id} style={{
                  display: "flex", gap: 14, alignItems: "center",
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)"
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", minWidth: 44 }}>{ev.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{ev.title}</div>
                    {ev.customer && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{ev.customer}</div>}
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, background: tc.bg, color: tc.text }}>{tc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Revenue Panel ──────────────────────────────────────────
function RevenuePanel() {
  const [view, setView] = useState("monthly");

  const maxRev = Math.max(...MONTHLY_REVENUE.map(m => Math.max(m.target, m.actual)));
  const yearTarget = MONTHLY_REVENUE.reduce((s, m) => s + m.target, 0);
  const yearActual = MONTHLY_REVENUE.reduce((s, m) => s + m.actual, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["monthly", "月次"], ["product", "商材別"], ["annual", "年次サマリ"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            padding: "6px 16px", borderRadius: 20, border: "1px solid",
            borderColor: view === k ? "#00D4FF" : "rgba(255,255,255,0.15)",
            background: view === k ? "rgba(0,212,255,0.12)" : "transparent",
            color: view === k ? "#00D4FF" : "rgba(255,255,255,0.5)",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit"
          }}>{l}</button>
        ))}
      </div>

      {/* Monthly bar chart */}
      {view === "monthly" && (
        <div>
          <div style={{
            display: "flex", gap: 4, marginBottom: 12,
            background: "rgba(255,184,48,0.08)", border: "1px solid rgba(255,184,48,0.2)",
            borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)"
          }}>
            📊 スプレッドシート連携 — 本番環境では <span style={{ color: "#FFB830", marginLeft: 4 }}>Google Sheets API</span> と接続してください
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, marginBottom: 12 }}>
            {MONTHLY_REVENUE.map((m, i) => {
              const tH = (m.target / maxRev) * 160;
              const aH = (m.actual / maxRev) * 160;
              const isPast = m.actual > 0;
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, width: "100%" }}>
                    <div style={{
                      flex: 1, height: tH, borderRadius: "4px 4px 0 0",
                      background: "rgba(255,255,255,0.1)",
                      minHeight: 2
                    }} />
                    {isPast && (
                      <div style={{
                        flex: 1, height: aH, borderRadius: "4px 4px 0 0",
                        background: m.actual >= m.target ? "#00E5A0" : "#00D4FF",
                        minHeight: 2, transition: "height 0.8s"
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{m.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} /> 目標</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 8, borderRadius: 2, background: "#00D4FF" }} /> 実績</div>
          </div>
        </div>
      )}

      {/* Product breakdown */}
      {view === "product" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {PRODUCT_REVENUE.map(p => {
            const total = p.q1 + p.q2 + p.q3 + p.q4;
            const maxP = Math.max(...PRODUCT_REVENUE.map(x => x.q1 + x.q2 + x.q3 + x.q4));
            return (
              <div key={p.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: "#fff" }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{fmt(total)}</div>
                </div>
                <MiniBar value={total} max={maxP} color={p.color} />
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  {["Q1", "Q2", "Q3", "Q4"].map((q, qi) => (
                    <div key={q} style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {q}: {fmt(p[`q${qi + 1}`])}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Annual summary */}
      {view === "annual" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { label: "年間目標", value: fmtFull(yearTarget), color: "rgba(255,255,255,0.7)" },
            { label: "現在実績", value: fmtFull(yearActual), color: "#00D4FF" },
            { label: "達成率", value: `${((yearActual / yearTarget) * 100).toFixed(1)}%`, color: yearActual >= yearTarget ? "#00E5A0" : "#FFB830" },
            { label: "残り目標", value: fmtFull(yearTarget - yearActual), color: "#FF6B6B" },
          ].map(item => (
            <div key={item.label} style={{
              padding: 20, borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1", padding: 16, borderRadius: 14, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>年間進捗</div>
            <MiniBar value={yearActual} max={yearTarget} color="#00D4FF" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              <span>¥0</span><span>{fmtFull(yearTarget)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Training Panel ─────────────────────────────────────────
function TrainingPanel() {
  const [expanded, setExpanded] = useState(null);
  const catColors = { "営業スキル": "#00D4FF", "製品知識": "#00E5A0", "マネジメント": "#B794F4", "デジタル": "#FFB830" };
  const overall = Math.round(TRAINING_PROGRAMS.reduce((s, p) => s + p.progress, 0) / TRAINING_PROGRAMS.length);

  return (
    <div>
      {/* Overall */}
      <div style={{
        display: "flex", alignItems: "center", gap: 24, padding: "20px 24px",
        borderRadius: 16, marginBottom: 24,
        background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(123,94,167,0.08) 100%)",
        border: "1px solid rgba(0,212,255,0.15)"
      }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircleProgress value={overall} size={88} color="#00D4FF" />
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#00D4FF" }}>{overall}%</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>総合進捗スコア</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            4プログラム · 合計31項目<br />
            完了: {TRAINING_PROGRAMS.reduce((s, p) => s + p.completed, 0)} / {TRAINING_PROGRAMS.reduce((s, p) => s + p.total, 0)}
          </div>
        </div>
      </div>

      {/* Programs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TRAINING_PROGRAMS.map(prog => {
          const color = catColors[prog.category];
          const isOpen = expanded === prog.id;
          return (
            <div key={prog.id} style={{
              borderRadius: 14, overflow: "hidden",
              border: `1px solid ${isOpen ? `${color}33` : "rgba(255,255,255,0.07)"}`,
              transition: "border-color 0.2s"
            }}>
              <div onClick={() => setExpanded(isOpen ? null : prog.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "14px 18px",
                  cursor: "pointer", background: isOpen ? `${color}08` : "rgba(255,255,255,0.03)"
                }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircleProgress value={prog.progress} size={52} stroke={5} color={color} />
                  <div style={{ position: "absolute", fontSize: 11, fontWeight: 700, color }}>{prog.progress}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{prog.title}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${color}15`, color }}>{prog.category}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{prog.completed}/{prog.total} 完了</span>
                  </div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 16px", background: `${color}04` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {prog.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px", borderRadius: 8,
                        background: item.done ? `${color}10` : "rgba(255,255,255,0.03)"
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, border: `1.5px solid`,
                          borderColor: item.done ? color : "rgba(255,255,255,0.2)",
                          background: item.done ? color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, fontSize: 10, color: "#0a0e1a", fontWeight: 800
                        }}>
                          {item.done ? "✓" : ""}
                        </div>
                        <span style={{ fontSize: 11, color: item.done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function SalesDashboard() {
  const [tab, setTab] = useState("crm");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const tabs = [
    { id: "crm", label: "CRM", icon: "👥" },
    { id: "schedule", label: "スケジュール", icon: "📅" },
    { id: "revenue", label: "売上管理", icon: "📊" },
    { id: "training", label: "育成進捗", icon: "🎯" },
  ];

  const kpis = [
    { label: "担当顧客", value: "6社", sub: "既存 4 / 商談中 1", color: "#00D4FF" },
    { label: "今月売上", value: "¥320万", sub: "目標比 58%", color: "#FFB830" },
    { label: "今日の予定", value: "2件", sub: "商談・提案", color: "#B794F4" },
    { label: "育成進捗", value: "55%", sub: "4プログラム", color: "#00E5A0" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c18",
      fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif",
      color: "#fff",
      padding: 0
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        button { cursor: pointer; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px"
      }} />

      {/* Glow orbs */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)"
      }} />
      <div style={{
        position: "fixed", bottom: -200, left: -200, width: 500, height: 500,
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(123,94,167,0.07) 0%, transparent 70%)"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* Header */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(0,212,255,0.7)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              Sales Personal Dashboard
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
              田中 誠司 <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>シニアセールスエンジニア</span>
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>2026年4月19日 (日)</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6,
              padding: "4px 12px", borderRadius: 20, fontSize: 11,
              background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.2)", color: "#00E5A0"
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5A0", animation: "pulse 2s infinite" }} />
              オンライン
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28, animationDelay: "0.1s" }}>
          {kpis.map((k, i) => (
            <div key={k.label} style={{
              padding: "18px 20px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid rgba(255,255,255,0.07)`,
              animationDelay: `${0.1 + i * 0.05}s`
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, padding: "6px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 12, border: "none",
              background: tab === t.id ? "rgba(0,212,255,0.12)" : "transparent",
              color: tab === t.id ? "#00D4FF" : "rgba(255,255,255,0.45)",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              transition: "all 0.2s", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: 24, borderRadius: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          minHeight: 500,
          animation: "fadeUp 0.3s ease"
        }}>
          {tab === "crm" && <CRMPanel />}
          {tab === "schedule" && <SchedulePanel />}
          {tab === "revenue" && <RevenuePanel />}
          {tab === "training" && <TrainingPanel />}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Sales Dashboard v1.0 · 本番環境では Google Calendar / Sheets API と接続
        </div>
      </div>
    </div>
  );
}
