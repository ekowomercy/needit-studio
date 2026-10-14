import { hashSync } from 'bcryptjs';
import { eq, inArray, or } from 'drizzle-orm';
import { id } from './ids';
import { getDatabase } from './index';
import * as schema from './schema';

const PASSWORD = process.env.SEED_PASSWORD ?? 'password123';

const seedCategories = [
  { slug: 'home-services', name: 'Home Services', icon: '🔧', children: [
    { slug: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { slug: 'electrical', name: 'Electrical', icon: '⚡' },
    { slug: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { slug: 'appliances-repair', name: 'Appliance Repair', icon: '🧰' },
    { slug: 'carpentry', name: 'Carpentry', icon: '🪚' },
  ] },
  { slug: 'goods', name: 'Goods & Products', icon: '📦', children: [
    { slug: 'phones', name: 'Phones', icon: '📱' },
    { slug: 'electronics', name: 'Electronics', icon: '🖥️' },
    { slug: 'appliances', name: 'Appliances', icon: '🧺' },
    { slug: 'furniture', name: 'Furniture', icon: '🛋️' },
    { slug: 'fashion', name: 'Fashion', icon: '👗' },
  ]},
  { slug: 'professional-services', name: 'Professional Services', icon: '💼', children: [
    { slug: 'graphic-design', name: 'Graphic Design', icon: '🎨' },
    { slug: 'photography', name: 'Photography', icon: '📷' },
    { slug: 'writing', name: 'Writing', icon: '✍️' },
    { slug: 'social-media', name: 'Social Media', icon: '📣' },
    { slug: 'virtual-assistance', name: 'Virtual Assistance', icon: '🖥️' },
  ]},
  { slug: 'education', name: 'Education', icon: '🎓', children: [
    { slug: 'tutors', name: 'Tutors', icon: '👩🏫' },
    { slug: 'homework-help', name: 'Homework Help', icon: '📚' },
    { slug: 'language-lessons', name: 'Language Lessons', icon: '🗣️' },
    { slug: 'exam-prep', name: 'Exam Preparation', icon: '📝' },
  ]},
  { slug: 'personal-services', name: 'Personal Services', icon: '💄', children: [
    { slug: 'hair', name: 'Hair', icon: '💇🏾‍♀️' },
    { slug: 'makeup', name: 'Makeup', icon: '💄' },
    { slug: 'tailoring', name: 'Tailoring', icon: '🧵' },
    { slug: 'beauty', name: 'Beauty', icon: '💅' },
  ]},
];

interface SeedUser {
  role: 'admin' | 'seller' | 'buyer';
  displayName: string;
  phone: string;
  email: string;
  isProvider: 0 | 1;
  locationCity: string;
  profile?: {
    headline: string;
    bio: string;
    areaCity: string;
    startingPriceKobo: number;
  };
}

const seedUsers: SeedUser[] = [
  {
    role: 'admin',
    displayName: 'NeedIt Admin',
    phone: '08000000001',
    email: 'admin@needit.ng',
    isProvider: 0,
    locationCity: 'Lagos',
  },
  {
    role: 'seller',
    displayName: 'NeedIt Seller',
    phone: '08000000002',
    email: 'seller@needit.ng',
    isProvider: 1,
    locationCity: 'Lagos',
    profile: {
      headline: 'Seller · Lagos',
      bio: 'Upload your products and services from the provider workspace.',
      areaCity: 'Lagos',
      startingPriceKobo: 5_000_00,
    },
  },
  {
    role: 'buyer',
    displayName: 'NeedIt Buyer',
    phone: '08000000003',
    email: 'buyer@needit.ng',
    isProvider: 0,
    locationCity: 'Lagos',
  },
];

const legacyDemoPhones = [
  '08011110001',
  '08022220002',
  '08033330003',
  '08044440004',
  '08055550005',
];

async function removeLegacyDemoProviders(db: ReturnType<typeof getDatabase>) {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(inArray(schema.users.phone, legacyDemoPhones));
  if (existing.length === 0) return 0;
  const ids = existing.map((row) => row.id);
  await db.delete(schema.messages).where(inArray(schema.messages.senderId, ids));
  await db
    .delete(schema.conversations)
    .where(
      or(
        inArray(schema.conversations.userId, ids),
        inArray(schema.conversations.providerId, ids),
      ),
    );
  await db
    .delete(schema.bookings)
    .where(
      or(inArray(schema.bookings.userId, ids), inArray(schema.bookings.providerId, ids)),
    );
  await db.delete(schema.needRequests).where(inArray(schema.needRequests.userId, ids));
  await db
    .delete(schema.reviews)
    .where(or(inArray(schema.reviews.authorId, ids), inArray(schema.reviews.providerId, ids)));
  await db.delete(schema.savedItems).where(inArray(schema.savedItems.userId, ids));
  await db.delete(schema.reports).where(inArray(schema.reports.reporterId, ids));
  await db.delete(schema.notifications).where(inArray(schema.notifications.userId, ids));
  await db.delete(schema.listings).where(inArray(schema.listings.providerId, ids));
  await db.delete(schema.providerProfiles).where(inArray(schema.providerProfiles.userId, ids));
  await db.delete(schema.users).where(inArray(schema.users.id, ids));
  return ids.length;
}

async function main() {
  const db = getDatabase();
  console.log('seeding categories…');

  const existingCategories = await db.select().from(schema.categories);
  const categoryIds = new Map<string, string>(
    existingCategories.map((c) => [c.slug, c.id]),
  );

  for (const parent of seedCategories) {
    let parentId = categoryIds.get(parent.slug);
    if (!parentId) {
      parentId = id('cat');
      await db.insert(schema.categories).values({
        id: parentId,
        slug: parent.slug,
        name: parent.name,
        icon: parent.icon,
        sortOrder: 0,
      });
      categoryIds.set(parent.slug, parentId);
    }
    let order = 0;
    for (const child of parent.children ?? []) {
      if (categoryIds.has(child.slug)) {
        order++;
        continue;
      }
      const childId = id('cat');
      await db.insert(schema.categories).values({
        id: childId,
        slug: child.slug,
        name: child.name,
        icon: child.icon,
        parentId,
        sortOrder: order++,
      });
      categoryIds.set(child.slug, childId);
    }
  }

  console.log('removing legacy demo providers…');
  const removed = await removeLegacyDemoProviders(db);
  if (removed > 0) console.log(`removed ${removed} legacy demo providers`);

  console.log('seeding users…');
  const passwordHash = hashSync(PASSWORD, 10);

  for (const u of seedUsers) {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(or(eq(schema.users.phone, u.phone), eq(schema.users.email, u.email)))
      .limit(1);
    if (existing.length > 0) {
      console.log(`skip existing ${u.role} (${u.email})`);
      continue;
    }
    const userId = id('usr');
    await db.insert(schema.users).values({
      id: userId,
      displayName: u.displayName,
      phone: u.phone,
      email: u.email,
      passwordHash,
      isProvider: u.isProvider,
      role: u.role,
      locationCity: u.locationCity,
    });
    if (u.profile) {
      await db.insert(schema.providerProfiles).values({
        id: id('prf'),
        userId,
        headline: u.profile.headline,
        bio: u.profile.bio,
        areaCity: u.profile.areaCity,
        areaRadiusKm: 20,
        startingPriceKobo: u.profile.startingPriceKobo,
      });
    }
    console.log(`created ${u.role}: ${u.email} / ${PASSWORD}`);
  }

  console.log(
    `seed complete: ${seedCategories.length} parent categories, ${seedUsers.length} users`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
