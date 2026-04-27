import { db, schema } from './index.js';
import bcrypt from 'bcryptjs';

const BRAND_KITS = [
  {
    supplier_name: 'Bacardi',
    primary_color_hex: '#a51c30',
    secondary_color_hex: '#f5f0eb',
    font_family: 'Instrument Serif',
    mandatory_disclaimers: [
      'Please drink responsibly.',
      'Must be 21+ to purchase.',
      '© Bacardi U.S.A., Inc. Coral Gables, FL.',
    ],
  },
  {
    supplier_name: 'Diageo',
    primary_color_hex: '#1a1a1a',
    secondary_color_hex: '#f8f8f4',
    font_family: 'Instrument Serif',
    mandatory_disclaimers: [
      'Drink Responsibly.',
      'Must be 21+ to purchase.',
    ],
  },
  {
    supplier_name: 'Pernod Ricard',
    primary_color_hex: '#0b3d2e',
    secondary_color_hex: '#f4f8f6',
    font_family: 'Instrument Serif',
    mandatory_disclaimers: [
      'Please drink responsibly.',
      'Must be 21+ to purchase.',
    ],
  },
];

const CUSTOMERS = [
  { name: 'Oakridge Tavern', primary_state: 'IL', supplier: 'Bacardi' },
  { name: 'La Playa Cantina', primary_state: 'FL', supplier: 'Bacardi' },
  { name: 'Saltgrass Steakhouse', primary_state: 'TX', supplier: 'Diageo' },
  { name: 'North Pier Hotel Bar', primary_state: 'NY', supplier: 'Pernod Ricard' },
  { name: 'Gilt Lounge', primary_state: 'CA', supplier: 'Diageo' },
  { name: 'The Daisy', primary_state: 'IL', supplier: 'Bacardi' },
];

async function main() {
  console.log('Seeding database…');

  // Seed brand kits
  const insertedKits = await db
    .insert(schema.brand_kits)
    .values(BRAND_KITS)
    .onConflictDoNothing()
    .returning();

  const kitMap = new Map(insertedKits.map((k) => [k.supplier_name, k.id]));

  // Seed customers
  for (const c of CUSTOMERS) {
    const brand_kit_id = kitMap.get(c.supplier);
    if (!brand_kit_id) continue;
    await db
      .insert(schema.customers)
      .values({ name: c.name, primary_state: c.primary_state, brand_kit_id })
      .onConflictDoNothing();
  }

  // Seed dev user
  const hash = await bcrypt.hash('password123', 10);
  await db
    .insert(schema.users)
    .values({ email: 'dev@hyble.com', password_hash: hash })
    .onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
