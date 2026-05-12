#!/usr/bin/env node
/**
 * ローカル Supabase（Docker）に dev テストユーザー 3 名を作成する。
 *
 * 通常は `npm run db:seed:dev` から呼ぶ
 * （`.env.docker.local` を dotenv-cli が渡してくれる）。
 *
 * 既に同じメールのユーザーがいる場合はスキップする（冪等）。
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。.env.local を確認してください。",
  );
  process.exit(1);
}

if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
  console.error(
    `❌ ローカル DB 以外（${url}）への seeding は許可されていません。`,
  );
  console.error("   このスクリプトは localhost / 127.0.0.1 でのみ動作します。");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: "dev-admin@nds.test",
    password: "devpass1234",
    full_name: "DEV 管理者",
    role: "admin",
    department: "管理部",
    title: "Administrator",
  },
  {
    email: "dev-manager@nds.test",
    password: "devpass1234",
    full_name: "DEV マネージャー",
    role: "manager",
    department: "営業1部",
    title: "Manager",
  },
  {
    email: "dev-member@nds.test",
    password: "devpass1234",
    full_name: "DEV 従業員",
    role: "member",
    department: "営業1部",
    title: "Sales",
  },
];

console.log(`→ Local Supabase: ${url}`);
console.log(`→ Seeding ${users.length} dev test users...\n`);

let created = 0;
let skipped = 0;

for (const u of users) {
  const { data: existing } = await admin.auth.admin.listUsers();
  if (existing?.users.some((x) => x.email === u.email)) {
    console.log(`⏭  ${u.email}  (already exists)`);
    skipped++;
    continue;
  }
  const { error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: {
      full_name: u.full_name,
      role: u.role,
      department: u.department,
      title: u.title,
    },
  });
  if (error) {
    console.error(`✗  ${u.email}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓  ${u.email}  (${u.role})`);
    created++;
  }
}

console.log(`\nDone: ${created} created, ${skipped} skipped.`);
console.log("\nLogin credentials:");
console.log("  dev-admin@nds.test    / devpass1234   (admin)");
console.log("  dev-manager@nds.test  / devpass1234   (manager)");
console.log("  dev-member@nds.test   / devpass1234   (member)");
