"use client";

import type { SheetSet } from "@/types";
import {
  emptyDevelopment,
  emptyGoal,
  emptyOneOnOne,
  emptyVision,
} from "@/lib/curriculum-data";

// 田中 誠司 (userId 1) の記入サンプル
function tanakaSheets(): SheetSet {
  const vision = emptyVision();
  vision.createdAt = "2026-01-15";
  vision.joinedAt = "2026-01-10";
  vision.age = "28";
  vision.birthplace = "神奈川県";
  vision.careerHistory = "中堅SIer 5年 → 当社";
  vision.other = "趣味: ランニング、読書";
  vision.principle1 = "誠実さを最優先する";
  vision.principle2 = "相手の事業成長に貢献する";
  vision.principle3 = "学び続ける姿勢を失わない";

  const goal = emptyGoal();
  goal.createdAt = "2026-01-20";
  goal.dueDate = "2026-04-10";
  goal.age = "28";
  goal.wishes["1ヶ月後"] = { content: "商材5種すべての基本テスト合格", url: "" };
  goal.wishes["3ヶ月後"] = { content: "月間獲得100P達成", url: "" };
  goal.wishes["6ヶ月後"] = { content: "PDCA自走、担当10社", url: "" };
  goal.wishes["1年後"] = { content: "主任登用、年収600万", url: "" };
  goal.wishes["3年後"] = { content: "課長、チームを持つ", url: "" };
  goal.wishes["5年後"] = { content: "部長、事業責任", url: "" };
  goal.wishes["未来"] = { content: "顧客の事業成長に不可欠なパートナーになる", url: "" };
  goal.career["プレーヤー"] = { income: "480万 / 月40万", requiredSkills: "商材5種理解、月100P、PDCA自走" };
  goal.career["主任"] = { income: "600万 / 月50万", requiredSkills: "月150P、新人メンター1名" };
  goal.career["課長"] = { income: "800万 / 月66万", requiredSkills: "チーム月500P、育成3名" };
  goal.career["部長"] = { income: "1,100万 / 月91万", requiredSkills: "事業責任、組織設計" };
  goal.career["役員"] = { income: "1,500万〜", requiredSkills: "経営判断" };

  const development = emptyDevelopment();
  development.department = "営業1部";
  development.period = "2026-01-10 〜 2026-07-10";
  development.goal3Months = "月間獲得100P達成、商材5種すべての基本テスト合格、PDCA自走";
  // マインド面: 3項目中2項目で本人評価「理解」◯、1項目「できている」◯
  development.categoryItems.mind[0].selfUnderstood = true;
  development.categoryItems.mind[0].trainerUnderstood = true;
  development.categoryItems.mind[0].selfCanDo = true;
  development.categoryItems.mind[1].selfUnderstood = true;
  development.categoryItems.mind[1].trainerUnderstood = true;
  development.categoryItems.portable[0].selfUnderstood = true;
  development.categoryItems.portable[0].trainerUnderstood = true;
  development.categoryItems.technical[0].selfUnderstood = true;
  development.categoryItems.technical[0].trainerUnderstood = true;
  // カリキュラム: 入社〜1週間と1ヶ月の一部を完了
  development.curriculum.forEach((c) => {
    if (c.period === "入社〜1週間") {
      c.selfUnderstood = true;
      c.trainerUnderstood = true;
      if (["w1-1", "w1-2", "w1-3", "w1-4", "w1-5", "w1-6", "w1-7"].includes(c.id)) {
        c.selfCanDo = true;
        c.trainerCanDo = true;
      }
    }
    if (c.id === "m1-1") {
      c.selfUnderstood = true;
      c.trainerUnderstood = true;
    }
  });

  const oneonone = emptyOneOnOne();
  oneonone.entries = [
    {
      id: "1on1-202602",
      date: "2026-02-15",
      health: "良好",
      personal: "引越しが落ち着いた",
      career: "商材理解に自信がついてきた",
      workAnxiety: "提案資料の質に迷いがある",
      monthlyReflection: "新規3社、獲得25P。ヒアリングが浅かった",
      other: "",
      managerComment: "ヒアリング勉強会に参加を推奨。次月は40P目標。",
      managerId: 2,
      reviewedAt: "2026-02-16",
    },
    {
      id: "1on1-202603",
      date: "2026-03-20",
      health: "多少疲労",
      personal: "家族と連休で旅行",
      career: "主任を目指したい",
      workAnxiety: "クロージング率が伸びない",
      monthlyReflection: "獲得40P達成。提案の型が整ってきた",
      other: "",
      managerComment: "クロージング練習を一緒にやりましょう。4月は50P目標。",
      managerId: 2,
      reviewedAt: "2026-03-21",
    },
  ];

  return { vision, goal, development, oneonone };
}

// 山田 優子 (userId 2, manager) - 6ヶ月以上前に入社済みで大半完了
function yamadaSheets(): SheetSet {
  const vision = emptyVision();
  vision.createdAt = "2025-04-01";
  vision.joinedAt = "2023-04-01";
  vision.age = "34";
  vision.birthplace = "東京都";
  vision.careerHistory = "大手SaaS企業 8年 → 当社マネージャー";
  vision.principle1 = "チームの成果最大化";
  vision.principle2 = "メンバーの成長を自分の成功より優先";
  vision.principle3 = "データに基づく意思決定";

  const development = emptyDevelopment();
  development.department = "営業1部";
  development.period = "2023-04-01 〜 2023-10-01 (完了)";
  development.goal3Months = "完了（2023年下期）";
  development.curriculum.forEach((c) => {
    c.selfUnderstood = true;
    c.selfCanDo = true;
    c.trainerUnderstood = true;
    c.trainerCanDo = true;
  });
  development.categoryItems.mind.forEach((i) => {
    i.selfUnderstood = i.selfCanDo = i.trainerUnderstood = i.trainerCanDo = true;
  });
  development.categoryItems.portable.forEach((i) => {
    i.selfUnderstood = i.selfCanDo = i.trainerUnderstood = i.trainerCanDo = true;
  });
  development.categoryItems.technical.forEach((i) => {
    i.selfUnderstood = i.selfCanDo = i.trainerUnderstood = i.trainerCanDo = true;
  });

  return {
    vision,
    goal: emptyGoal(),
    development,
    oneonone: emptyOneOnOne(),
  };
}

const SEED_FLAG = "sheet-seed-v1";

export function seedSheetsIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const seeds: Record<number, SheetSet> = {
    1: tanakaSheets(),
    2: yamadaSheets(),
  };
  for (const [uid, set] of Object.entries(seeds)) {
    const id = Number(uid);
    const pfx = `sheet-v1:${id}`;
    localStorage.setItem(`${pfx}:vision`, JSON.stringify(set.vision));
    localStorage.setItem(`${pfx}:goal`, JSON.stringify(set.goal));
    localStorage.setItem(`${pfx}:development`, JSON.stringify(set.development));
    localStorage.setItem(`${pfx}:oneonone`, JSON.stringify(set.oneonone));
  }
  localStorage.setItem(SEED_FLAG, "1");
}
