/**
 * generate-nfl-theme.mjs
 * Creates "NFL Stars" theme: generates 60 unique card art images (one per unit/player)
 * via HuggingFace FLUX.1-schnell, then inserts the theme + 60 unit overrides into Supabase.
 *
 * Usage: node scripts/generate-nfl-theme.mjs
 * Resumable: skips already-downloaded images.
 */

import fs   from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── 1. Read env ───────────────────────────────────────────────────────────────

async function readEnv() {
  const raw = await fs.readFile(path.join(ROOT, '.env.local'), 'utf-8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

// ── 2. NFL name mapping (original unit name → NFL player name) ────────────────
// Affinities → NFL positions
// Lightning=QB | Air=WR | Earth=OL | Water=RB | Fire=DE | Ice=CB | Nature=LB | Light=S | Shadow=Nickel

const NFL_NAMES = {
  // ── LIGHTNING → Quarterback ──────────────────────────────────────────────
  'Bolt Lizard':    'Jake "Rookie" Burns',
  'Spark Fly':      'Tyler "Spark" Cole',
  'Zap Frog':       'Drew "Zapper" Walsh',
  'Static Panther': 'Ryan "Static" Mitchell',
  'Thunder Wolf':   'Dez "Thunder" Jackson',
  'Plasma Hydra':   'Cam "Voltage" Newton Jr',
  'Storm Dragon':   'Marcus "Storm" Vick',

  // ── ICE → Cornerback ─────────────────────────────────────────────────────
  'Chill Hare':      'Chris "Chill" Evans',
  'Frost Beetle':    'Bobby "Frost" Williamson',
  'Snow Cub':        'Kyle "Snowflake" Harper',
  'Glacier Elk':     'Marcus "Glacier" Reeves',
  'Permafrost Boar': 'Kevin "Iceberg" Stone',
  'Glacier Titan':   'Deion "Arctic King" Frost',

  // ── FIRE → Defensive End ─────────────────────────────────────────────────
  'Cinder Fox':     'Marcus "Ember" Reeves',
  'Ember Moth':     'Jerome "Firefly" Williams',
  'Flame Newt':     'Ron "Flame" Brown',
  'Blaze Tiger':    'D.J. "Blaze" Martin',
  'Magma Lion':     'Earl "Magma" Hall',
  'Inferno Phoenix':'Reggie "Inferno" White Jr',
  'Eternal Flame':  'Lawrence "Eternal" Taylor',

  // ── LIGHT → Safety ───────────────────────────────────────────────────────
  'Dawn Bird':        'Earl "Dawn" Thomas',
  'Glow Moth':        'Bob "Beacon" Sanders',
  'Radiant Crane':    'Marcus "Radiant" Allen',
  'Solar Falcon':     'Ronnie "Solar" Lott',
  'Celestial Seraph': 'Mel "Celestial" Blount',
  'Celestial Judge':  'Ed "The Judge" Reed',

  // ── SHADOW → Blitz Specialist / Nickelback ───────────────────────────────
  'Dusk Bat':     'Nate "Ghost" Clements',
  'Eclipse Raven':'Charles "Eclipse" Woodson',
  'Void Jackal':  'Darrelle "Void" Revis',
  'Umbra Specter':'Darrell "Shadow" Green',
  'The Darkness': 'Deion "Prime Time" Sanders',

  // ── AIR → Wide Receiver ──────────────────────────────────────────────────
  'Gust Sprite':      'Tavon "Wind" Austin',
  'Storm Finch':      'Randall "Storm" Cobb',
  'Wind Hawk':        'Danny "Gust" Amendola',
  'Cyclone Eagle':    'DeSean "Cyclone" Jackson',
  'Tempest Lynx':     'Brandin "Tempest" Cooks',
  'Sky Leviathan':    'Tyreek "Skyline" Hill',
  'Vortex Griffin':   'Calvin "Vortex" Johnson',
  'Sovereign Tempest':'Jerry "Sovereign" Rice',

  // ── NATURE → Linebacker ──────────────────────────────────────────────────
  'Leaf Sprite':       'Clay "Roots" Matthews Jr',
  'Thorn Shrub':       'Karlos "Thorny" Dansby',
  'Vine Crawler':      'Rocky "Vine" Boiman',
  'Bramble Bear':      'Luke "Bramble" Kuechly',
  'Grove Stag':        'Bobby "Grove" Wagner',
  'World Tree Spirit': 'Tedy "World" Bruschi',

  // ── EARTH → Offensive Lineman ────────────────────────────────────────────
  'Mud Toad':          'Orlando "Muddy" Pace',
  'Rock Beetle':       'Jonathan "Rock" Ogden',
  'Stone Crab':        'Jim "Stone" Tyrer',
  'Granite Bear':      'Joe "Granite" Thomas',
  'Quake Rhino':       'Anthony "Quake" Munoz',
  'Ancient Tortoise':  'Forrest "Ancient" Gregg',
  'Tectonic Golem':    'Bruce "Tectonic" Matthews',
  'Elder of Mountains':'Walter "Mountains" Jones',

  // ── WATER → Running Back ─────────────────────────────────────────────────
  'Stream Turtle': 'BJ "Stream" Green-Ellis',
  'Tide Fish':     'Cedric "Tidal" Benson',
  'Wave Crab':     'Thomas "Wave" Jones',
  'Deep Serpent':  'Marshawn "Deep" Lynch',
  'Tidal Drake':   'Ezekiel "Tidal" Elliott',
  'Abyssal Kraken':'Adrian "Abyss" Peterson',
  "Ocean's Wrath": 'Emmitt "Ocean" Smith',
}

// ── 3. Prompt builders ────────────────────────────────────────────────────────

// Position description per affinity
const POSITION_DESC = {
  Lightning: 'NFL quarterback dropping back to throw, electric blue lightning aura, spiral football in hand',
  Air:       'NFL wide receiver leaping for an acrobatic catch, wind currents swirling around him',
  Earth:     'NFL offensive lineman in powerful blocking stance, massive build, rocks and earth crumbling',
  Water:     'NFL running back breaking through defenders, water and mist trail behind him',
  Fire:      'NFL defensive end sacking a quarterback, fire and smoke energy around his arms',
  Ice:       'NFL cornerback leaping for an interception, ice blue crystalline aura',
  Nature:    'NFL linebacker blitzing hard, nature vines and leaves swirling around him',
  Light:     'NFL safety in coverage, golden radiant light halo, guardian pose high above the field',
  Shadow:    'NFL nickelback blitz specialist in stealthy low stance, dark smoke and shadows trailing',
}

// Rarity visual upgrade (same logic as original generate-images.ts)
const RARITY_STYLE = {
  Common:    'simple clean design, standard uniform',
  Rare:      'powerful athlete, detailed design, dynamic pose',
  Epic:      'elite imposing athlete, dramatic cinematic pose, intense expression',
  Legendary: 'legendary iconic athlete, godlike presence, awe-inspiring, explosive energy',
}

function buildPrompt(nflName, affinity, rarity) {
  return (
    `${nflName}, ${POSITION_DESC[affinity] ?? affinity}, ` +
    `${RARITY_STYLE[rarity] ?? rarity}, ` +
    `fantasy sports TCG card art, vibrant digital painting, ` +
    `dramatic stadium lighting, isolated on dark gradient background, ` +
    `highly detailed, game art style, no text, no border`
  )
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── 4. Generate image via HuggingFace ─────────────────────────────────────────

async function generateImage(prompt, outputPath, token) {
  const MODEL = 'black-forest-labs/FLUX.1-schnell'
  const url   = `https://router.huggingface.co/hf-inference/models/${MODEL}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'x-use-cache':   'false',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { num_inference_steps: 4, width: 512, height: 512 },
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (res.status === 503) {
    const body = await res.json().catch(() => ({}))
    const wait = Math.ceil((body.estimated_time ?? 20) * 1000)
    process.stdout.write(` (model loading, waiting ${Math.round(wait/1000)}s…)`)
    await new Promise(r => setTimeout(r, wait))
    return generateImage(prompt, outputPath, token)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HF ${res.status}: ${text.slice(0, 150)}`)
  }

  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(outputPath, buf)
  return buf.length
}

// ── 5. Supabase REST helper ───────────────────────────────────────────────────

async function sbFetch(baseUrl, key, method, urlPath, body) {
  const headers = {
    'apikey':        key,
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'

  const res = await fetch(`${baseUrl}/rest/v1${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

// ── 6. Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏈 NFL Stars Theme Generator — 60 unique player cards\n')

  const env = await readEnv()
  const HF_TOKEN = env.HUGGINGFACE_API_TOKEN
  const SB_URL   = env.NEXT_PUBLIC_SUPABASE_URL
  const SB_KEY   = env.SUPABASE_SERVICE_ROLE_KEY

  if (!HF_TOKEN || !SB_URL || !SB_KEY) {
    throw new Error('Missing env vars: HUGGINGFACE_API_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  }

  const outDir = path.join(ROOT, 'public', 'nfl-theme')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  // ── Step 1: Fetch all units ───────────────────────────────────────────────
  console.log('📋 Fetching units from Supabase…')
  const { data: units } = await sbFetch(SB_URL, SB_KEY, 'GET', '/units?select=id,name,affinity,rarity&order=affinity,rarity,name', null)
  console.log(`   Found ${units.length} units\n`)

  // ── Step 2: Resolve or create theme ──────────────────────────────────────
  console.log('📦 Creating theme in Supabase…')
  const { data: existing } = await sbFetch(SB_URL, SB_KEY, 'GET', '/themes?name=eq.NFL%20Stars&select=id', null)

  let themeId
  if (existing && existing.length > 0) {
    themeId = existing[0].id
    console.log(`   Theme already exists (id: ${themeId})`)
  } else {
    const { data: created } = await sbFetch(SB_URL, SB_KEY, 'POST', '/themes', {
      name:        'NFL Stars',
      description: 'American Football theme — each unit becomes an NFL player. Same stats, same affinity, new identity.',
    })
    themeId = Array.isArray(created) ? created[0].id : created.id
    console.log(`   Created theme (id: ${themeId})`)
  }

  // ── Step 3: Generate one image per unit ───────────────────────────────────
  console.log(`\n🎨 Generating images — ${units.length} total, skips existing\n`)

  let done = 0, skipped = 0, failed = 0
  const overrides = []

  for (let i = 0; i < units.length; i++) {
    const unit    = units[i]
    const nflName = NFL_NAMES[unit.name]

    if (!nflName) {
      console.log(`[${String(i+1).padStart(2,'0')}/${units.length}] ⚠ No mapping for: "${unit.name}"`)
      failed++
      continue
    }

    const slug      = toSlug(nflName)
    const filename  = `${slug}.png`
    const filepath  = path.join(outDir, filename)
    const publicPath = `/nfl-theme/${filename}`

    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${units.length}] ${nflName.padEnd(32)}`)

    if (existsSync(filepath)) {
      console.log('⏭  already exists')
      skipped++
      overrides.push({ theme_id: themeId, unit_id: unit.id, name_override: nflName, image_override: publicPath })
      continue
    }

    const prompt = buildPrompt(nflName, unit.affinity, unit.rarity)

    try {
      const bytes = await generateImage(prompt, filepath, HF_TOKEN)
      console.log(`✅  (${Math.round(bytes/1024)}KB)`)
      done++
      overrides.push({ theme_id: themeId, unit_id: unit.id, name_override: nflName, image_override: publicPath })
    } catch (err) {
      console.log(`❌  ${err.message}`)
      failed++
    }

    // Respect HF free tier rate limits
    if (i < units.length - 1) await new Promise(r => setTimeout(r, 1200))
  }

  // ── Step 4: Upsert all overrides ─────────────────────────────────────────
  console.log(`\n🔄 Upserting ${overrides.length} unit overrides…`)
  if (overrides.length > 0) {
    const { ok, status, data } = await sbFetch(
      SB_URL, SB_KEY, 'POST',
      '/theme_unit_overrides?on_conflict=theme_id%2Cunit_id',
      overrides,
    )
    if (!ok) console.error(`  ✗ Failed: ${status} — ${JSON.stringify(data)}`)
    else console.log(`  ✓ Done`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Summary ──────────────────────────')
  console.log(`   ✅ Generated : ${done}`)
  console.log(`   ⏭  Skipped   : ${skipped}`)
  console.log(`   ❌ Failed    : ${failed}`)
  console.log(`\n   Theme ID: ${themeId}`)
  console.log(`   Images → public/nfl-theme/`)
  console.log(`   Deploy to Vercel, then assign theme in /admin/theme\n`)
}

main().catch((err) => { console.error('\n✗ Error:', err.message); process.exit(1) })
