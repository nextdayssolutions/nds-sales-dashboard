import { useState } from "react";

const MOCK_USERS = [
  { id: 1, name: "田中 誠司", email: "tanaka@example.co.jp", role: "member", status: "active", dept: "営業1部", lastLogin: "2026-04-19 09:32", achievement: 58, customers: 6 },
  { id: 2, name: "山田 優子", email: "yamada@example.co.jp", role: "manager", status: "active", dept: "営業1部", lastLogin: "2026-04-19 08:15", achievement: 112, customers: 12 },
  { id: 3, name: "佐藤 健太", email: "sato@example.co.jp", role: "member", status: "active", dept: "営業2部", lastLogin: "2026-04-18 18:44", achievement: 87, customers: 9 },
  { id: 4, name: "鈴木 まり", email: "suzuki@example.co.jp", role: "member", status: "invited", dept: "営業2部", lastLogin: "—", achievement: 0, customers: 0 },
  { id: 5, name: "高橋 翔", email: "takahashi@example.co.jp", role: "member", status: "active", dept: "営業1部", lastLogin: "2026-04-19 10:12", achievement: 94, customers: 8 },
  { id: 6, name: "伊藤 由紀", email: "ito@example.co.jp", role: "admin", status: "active", dept: "管理部", lastLogin: "2026-04-19 11:05", achievement: null, customers: null },
  { id: 7, name: "渡辺 龍一", email: "watanabe@example.co.jp", role: "member", status: "suspended", dept: "営業2部", lastLogin: "2026-03-28 14:22", achievement: 32, customers: 4 },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: MOCK_USERS.length,
    active: MOCK_USERS.filter(u => u.status === "active").length,
    invited: MOCK_USERS.filter(u => u.status === "invited").length,
    avgAchievement: Math.round(MOCK_USERS.filter(u => u.achievement !== null).reduce((s, u) => s + u.achievement, 0) / MOCK_USERS.filter(u => u.achievement !== null).length)
  };

  const roleLabel = { admin: "管理者", manager: "マネージャー", member: "従業員" };
  const roleColor = { admin: "#FF6B6B", manager: "#FFB830", member: "#00D4FF" };
  const statusLabel = { active: "アクティブ", invited: "招待中", suspended: "停止中", retired: "退職" };
  const statusColor = { active: "#00E5A0", invited: "#FFB830", suspended: "#FF6B6B", retired: "rgba(255,255,255,0.3)" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c18",
      fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif",
      color: "#fff"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(255,107,107,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,107,0.02) 1px, transparent 1px)`,
        backgroundSize: "48px 48px"
      }} />
      <div style={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle, rgba(255,107,107,0.05) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,107,107,0.7)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
              🛡 Admin Console
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
              管理者ダッシュボード <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>伊藤 由紀</span>
            </h1>
          </div>
          <button onClick={() => setShowInvite(true)} style={{
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            boxShadow: "0 4px 20px rgba(0,212,255,0.3)",
            display: "flex", alignItems: "center", gap: 8
          }}>
            ＋ 従業員を招待
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "総従業員数", value: stats.total, sub: "全ロール合計", color: "#00D4FF" },
            { label: "アクティブ", value: stats.active, sub: "ログイン可能", color: "#00E5A0" },
            { label: "招待中", value: stats.invited, sub: "未パスワード設定", color: "#FFB830" },
            { label: "平均達成率", value: `${stats.avgAchievement}%`, sub: "今月目標比", color: "#B794F4" },
          ].map(k => (
            <div key={k.label} style={{
              padding: "18px 20px", borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, letterSpacing: "-0.02em" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, padding: "6px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { id: "users", label: "👥 従業員管理" },
            { id: "sheets", label: "📋 シート配布" },
            { id: "analytics", label: "📊 全社分析" },
            { id: "audit", label: "🔒 監査ログ" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 12, border: "none",
              background: tab === t.id ? "rgba(255,107,107,0.12)" : "transparent",
              color: tab === t.id ? "#FF6B6B" : "rgba(255,255,255,0.45)",
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div style={{
            padding: 24, borderRadius: 20,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)"
          }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <input
                type="text"
                placeholder="🔍 名前・メールで検索..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 13, outline: "none"
                }}
              />
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, outline: "none"
              }}>
                <option value="all" style={{ background: "#080c18" }}>全ロール</option>
                <option value="admin" style={{ background: "#080c18" }}>管理者</option>
                <option value="manager" style={{ background: "#080c18" }}>マネージャー</option>
                <option value="member" style={{ background: "#080c18" }}>従業員</option>
              </select>
              <button style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)", fontSize: 13
              }}>📥 CSV出力</button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                    <th style={{ padding: "0 12px 8px" }}>従業員</th>
                    <th style={{ padding: "0 12px 8px" }}>部署 / ロール</th>
                    <th style={{ padding: "0 12px 8px" }}>ステータス</th>
                    <th style={{ padding: "0 12px 8px" }}>達成率</th>
                    <th style={{ padding: "0 12px 8px" }}>担当</th>
                    <th style={{ padding: "0 12px 8px" }}>最終ログイン</th>
                    <th style={{ padding: "0 12px 8px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} style={{ background: "rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "14px 12px", borderRadius: "10px 0 0 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{u.dept}</div>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10,
                          background: `${roleColor[u.role]}15`, color: roleColor[u.role], marginTop: 4,
                          border: `1px solid ${roleColor[u.role]}30`
                        }}>{roleLabel[u.role]}</span>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "3px 10px", borderRadius: 20, fontSize: 11,
                          background: `${statusColor[u.status]}15`, color: statusColor[u.status]
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[u.status] }} />
                          {statusLabel[u.status]}
                        </span>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        {u.achievement !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                              <div style={{
                                width: `${Math.min(u.achievement, 100)}%`, height: "100%",
                                background: u.achievement >= 100 ? "#00E5A0" : u.achievement >= 70 ? "#00D4FF" : "#FFB830"
                              }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{u.achievement}%</span>
                          </div>
                        ) : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                        {u.customers !== null ? `${u.customers}社` : "—"}
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.lastLogin}</td>
                      <td style={{ padding: "14px 12px", borderRadius: "0 10px 10px 0" }}>
                        <button style={{
                          padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
                          background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 11
                        }}>編集</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>
              {filtered.length} / {MOCK_USERS.length} 件表示
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {tab !== "users" && (
          <div style={{
            padding: 60, borderRadius: 20,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            textAlign: "center", color: "rgba(255,255,255,0.3)"
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div style={{ fontSize: 13 }}>このタブは開発中です</div>
          </div>
        )}

        {/* Invite modal */}
        {showInvite && (
          <div onClick={() => setShowInvite(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#0f1424", borderRadius: 20, padding: 28,
              border: "1px solid rgba(0,212,255,0.2)", width: "100%", maxWidth: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
            }}>
              <div style={{ fontSize: 11, color: "rgba(0,212,255,0.7)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>
                Invite New Employee
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>従業員を招待</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "メールアドレス", placeholder: "tanaka@example.co.jp", type: "email" },
                  { label: "氏名", placeholder: "田中 誠司", type: "text" },
                  { label: "部署", placeholder: "営業1部", type: "text" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff", fontSize: 13, outline: "none"
                    }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>ロール</label>
                  <select style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, outline: "none"
                  }}>
                    <option value="member" style={{ background: "#0f1424" }}>従業員</option>
                    <option value="manager" style={{ background: "#0f1424" }}>マネージャー</option>
                    <option value="admin" style={{ background: "#0f1424" }}>管理者</option>
                  </select>
                </div>
              </div>

              <div style={{
                marginTop: 18, padding: "10px 14px", borderRadius: 10,
                background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)",
                fontSize: 11, color: "rgba(255,255,255,0.6)"
              }}>
                💡 Google Workspace SSOが有効です。本人はGoogleアカウントでログインします（パスワード設定不要）。
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setShowInvite(false)} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 13
                }}>キャンセル</button>
                <button style={{
                  flex: 2, padding: "12px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #00D4FF 0%, #7B5EA7 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 13
                }}>招待メールを送信</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
