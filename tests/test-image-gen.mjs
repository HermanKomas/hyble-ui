import OpenAI from 'openai';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load .env from repo root
// .env is at repo root — resolve relative to this file's location (tests/)
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const envLines = readFileSync(resolve(__dirname, '../.env'), 'utf-8').split('\n');
const env = {};
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const model = env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2-2026-04-21';

console.log(`Using model: ${model}`);
console.log('Generating image...');

const prompt = `
A subtle, elegant cocktail menu for an Irish bar called "The Jameson House" in Edinburgh, Scotland.
St. Patrick's Day edition. Dark green and gold colour palette, classic serif typography.
Four Jameson Irish Whiskey cocktails listed:
1. Jameson Sour — Jameson, lemon juice, simple syrup, egg white
2. Irish Mule — Jameson, ginger beer, lime, mint
3. Celtic Old Fashioned — Jameson Black Barrel, demerara, Angostura bitters
4. Emerald Spritz — Jameson, elderflower, prosecco, cucumber
Clean print-ready layout, portrait A5 format, understated and premium feel.
`.trim();

try {
  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: '1024x1536',
    quality: 'medium',
    response_format: 'b64_json',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');

  const outPath = resolve(process.cwd(), 'tests/jameson-menu-test.png');
  writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log(`✓ Image saved to: ${outPath}`);
} catch (err) {
  console.error('✗ Generation failed:', err.message);
  if (err.status) console.error('  HTTP status:', err.status);
  if (err.error) console.error('  Error detail:', JSON.stringify(err.error, null, 2));
  process.exit(1);
}
