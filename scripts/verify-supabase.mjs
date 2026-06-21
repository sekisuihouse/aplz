import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const env = readEnv(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const tables = [
  "profiles",
  "communities",
  "apps",
  "comments",
  "ratings",
  "reactions",
  "community_members",
  "api_tokens",
  "requests",
  "solutions",
  "request_comments",
  "solution_feedback",
  "notifications",
  "reports",
  "analytics_visitors",
  "analytics_sessions",
  "analytics_events",
];

let hasError = false;
console.log(`Checking Supabase schema at ${redactProjectUrl(supabaseUrl)}\n`);

for (const table of tables) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  const text = await res.text();
  if (res.ok) {
    console.log(`OK   ${table}`);
    continue;
  }
  hasError = true;
  let message = text;
  try {
    const json = JSON.parse(text);
    message = json.message || json.code || text;
  } catch {
    // Keep raw text.
  }
  console.log(`FAIL ${table}: ${res.status} ${message}`);
}

if (hasError) {
  console.error("\nSupabase schema is not ready. Run these migrations in order:");
  console.error("1. supabase/migrations/202606120000_initial_core_schema.sql");
  console.error("2. supabase/migrations/202606120001_request_platform.sql");
  console.error("3. supabase/migrations/202606170001_data_api_grants.sql");
  console.error("4. supabase/migrations/202606210001_product_analytics.sql");
  console.error("\nThen run:");
  console.error("select pg_notify('pgrst', 'reload schema');");
  process.exit(1);
}

console.log("\nSupabase schema is ready.");

function readEnv(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function redactProjectUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "configured project";
  }
}
