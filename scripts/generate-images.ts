/**
 * Generate unit images via Hugging Face Inference API (free tier).
 * Model: black-forest-labs/FLUX.1-schnell
 *
 * Setup:
 *   1. Create free account at huggingface.co
 *   2. Go to Settings → Access Tokens → New token (Read)
 *   3. Add to .env.local: HUGGINGFACE_API_TOKEN=hf_xxxxx
 *
 * Run: npm run generate:images
 * Resumable: skips already-downloaded files.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* env already set */ }
}
loadEnv();

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
if (!HF_TOKEN) {
  console.error("\n❌ Missing HUGGINGFACE_API_TOKEN in .env.local");
  console.error("   Get a free token at: https://huggingface.co/settings/tokens\n");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ── Affinity → visual descriptor ────────────────────────────────────────────
const affinityVisual: Record<string, string> = {
  Air:       "sky blue and white, swirling winds, storm clouds, air elemental",
  Earth:     "brown and dark green, stone texture, rocky terrain, earth golem",
  Lightning: "electric yellow and blue, crackling lightning, plasma energy",
  Water:     "deep blue and teal, water droplets, ocean waves, aquatic",
  Fire:      "red orange and yellow, flames and embers, molten lava",
  Ice:       "cyan and silver white, frost crystals, frozen tundra, ice shards",
  Nature:    "vivid green and brown, leaves and vines, ancient forest",
  Light:     "golden yellow and white, radiant holy glow, divine light",
  Shadow:    "dark purple and black, shadow mist, void and darkness",
};

const rarityStyle: Record<string, string> = {
  Common:    "small cute creature, simple design",
  Rare:      "powerful creature, detailed design",
  Epic:      "large epic imposing creature, dramatic pose",
  Legendary: "legendary godlike creature, cinematic, awe-inspiring",
};

function buildPrompt(name: string, affinity: string, rarity: string): string {
  return (
    `${name}, ${affinityVisual[affinity] ?? affinity}, ` +
    `${rarityStyle[rarity] ?? rarity}, ` +
    `fantasy TCG card creature artwork, vibrant digital painting, ` +
    `dramatic lighting, isolated on dark gradient background, ` +
    `highly detailed, game art style, no text, no border`
  );
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── HuggingFace Inference API call ───────────────────────────────────────────
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";

async function generateImage(prompt: string, destPath: string): Promise<boolean> {
  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        "x-use-cache": "false",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width: 512, height: 512, num_inference_steps: 4 },
      }),
      signal: AbortSignal.timeout(120_000),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Model loading (503) — retry once after delay
    if (res.status === 503) {
      const parsed = JSON.parse(body || "{}");
      const wait = Math.ceil((parsed.estimated_time ?? 20) * 1000);
      process.stdout.write(` (model loading, waiting ${Math.ceil(wait / 1000)}s...)`);
      await new Promise((r) => setTimeout(r, wait));
      return generateImage(prompt, destPath); // one retry
    }
    console.error(`\n  ✗ HTTP ${res.status}: ${body.slice(0, 120)}`);
    return false;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    const body = await res.text();
    console.error(`\n  ✗ Unexpected content-type: ${contentType} — ${body.slice(0, 120)}`);
    return false;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = resolve(process.cwd(), "public", "units");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const { data: units, error } = await supabase
    .from("units")
    .select("id, name, rarity, affinity")
    .order("rarity")
    .order("name");

  if (error || !units) {
    console.error("Failed to fetch units:", error?.message);
    process.exit(1);
  }

  console.log(`\n🎨 Generating images — ${HF_MODEL}`);
  console.log(`   ${units.length} units → public/units/\n`);

  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const slug = toSlug(unit.name);
    const ext = "png";
    const filePath = resolve(outDir, `${slug}.${ext}`);
    const publicPath = `/units/${slug}.${ext}`;

    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${units.length}] ${unit.name.padEnd(26)}`);

    if (existsSync(filePath)) {
      console.log("⏭  already exists");
      skipped++;
      await supabase.from("units").update({ image: publicPath }).eq("id", unit.id).is("image", null);
      continue;
    }

    const prompt = buildPrompt(unit.name, unit.affinity, unit.rarity);

    try {
      const ok = await generateImage(prompt, filePath);
      if (ok) {
        await supabase.from("units").update({ image: publicPath }).eq("id", unit.id);
        console.log("✅");
        done++;
      } else {
        console.log("❌");
        failed++;
      }
    } catch (err: unknown) {
      console.log(`❌ ${err instanceof Error ? err.message : err}`);
      failed++;
    }

    // Respect rate limits — HF free tier allows ~1 req/sec
    if (i < units.length - 1) await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n── Summary ──────────────────────`);
  console.log(`   ✅ Generated : ${done}`);
  console.log(`   ⏭  Skipped   : ${skipped}`);
  console.log(`   ❌ Failed    : ${failed}`);
  if (done > 0) console.log(`\n   Images in public/units/ — served at /units/<slug>.png`);
}

main();
