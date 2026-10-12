import { hashSync } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDatabase } from './index';
import * as schema from './schema';
import { id } from './ids';

const PASSWORD = 'password123';

const seedCategories = [
  { slug: 'home-services', name: 'Home Services', icon: '🔧', children: [
    { slug: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { slug: 'electrical', name: 'Electrical', icon: '💡' },
    { slug: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { slug: 'repairs', name: 'Repairs', icon: '🔩' },
    { slug: 'painting', name: 'Painting', icon: '🎨' },
    { slug: 'moving', name: 'Moving', icon: '🚚' },
  ]},
  { slug: 'used-products', name: 'Used Products', icon: '📱', children: [
    { slug: 'phones', name: 'Phones', icon: '📱' },
    { slug: 'electronics', name: 'Electronics', icon: '🖥️' },
    { slug: 'appliances', name: 'Appliances', icon: '🧺' },
    { slug: 'furniture', name: 'Furniture', icon: '🛋️' },
    { slug: 'household', name: 'Household', icon: '🏠' },
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

  console.log('seeding providers…');
  const passwordHash = hashSync(PASSWORD, 10);
  interface SeedProvider {
  name: string;
  phone: string;
  headline: string;
  bio: string;
  city: string;
  radius: number;
  starting: number;
  jobs: number;
  rating: number;
  reviews: number;
  listings: {
    type: 'product' | 'service';
    title: string;
    cat: string;
    desc: string;
    starting: number;
  }[];
}

const providers: SeedProvider[] = [
    {
      name: 'Musa Bello',
      phone: '08011110001',
      headline: 'Plumber · Ikeja, Lagos',
      bio: 'Fixing taps, pipes, toilets and water heaters. Available Monday–Saturday.',
      city: 'Ikeja, Lagos',
      radius: 20,
      starting: 8_000_00,
      jobs: 47,
      rating: 4.9,
      reviews: 214,
      listings: [
        { type: 'service', title: 'Plumbing repair', cat: 'plumbing', desc: 'Leaking taps, burst pipes, toilet repairs.', starting: 8_000_00 },
        { type: 'service', title: 'Pipe installation', cat: 'plumbing', desc: 'Full pipe installation and replacement.', starting: 25_000_00 },
      ],
    },
    {
      name: 'Gift Okafor',
      phone: '08022220002',
      headline: 'Used appliances · Lekki, Lagos',
      bio: 'Gently used appliances with warranty from trusted owners.',
      city: 'Lekki, Lagos',
      radius: 25,
      starting: 50_000_00,
      jobs: 120,
      rating: 4.7,
      reviews: 380,
      listings: [
        { type: 'product', title: 'Used washing machine', cat: 'appliances', desc: 'Top-loader, fair condition, works perfectly.', starting: 135_000_00 },
        { type: 'product', title: 'Used fridge', cat: 'appliances', desc: 'Single door fridge, like new.', starting: 120_000_00 },
      ],
    },
    {
      name: 'Chinaza Umeh',
      phone: '08033330003',
      headline: 'Graphic designer · Lagos',
      bio: 'Flyers, logos, social media designs, business cards.',
      city: 'Lagos',
      radius: 0,
      starting: 15_000_00,
      jobs: 89,
      rating: 4.6,
      reviews: 180,
      listings: [
        { type: 'service', title: 'Flyer design', cat: 'graphic-design', desc: 'Birthday, business or event flyers.', starting: 15_000_00 },
        { type: 'service', title: 'Logo design', cat: 'graphic-design', desc: 'Brand identity and logo packages.', starting: 50_000_00 },
      ],
    },
    {
      name: 'Aisha Mohammed',
      phone: '08044440004',
      headline: 'Mathematics tutor · Abuja',
      bio: 'Primary and secondary maths, WAEC/JAMB prep. Online or in person.',
      city: 'Wuse, Abuja',
      radius: 15,
      starting: 10_000_00,
      jobs: 64,
      rating: 4.8,
      reviews: 130,
      listings: [
        { type: 'service', title: 'Maths tutoring', cat: 'tutors', desc: 'One-on-one maths, all levels.', starting: 10_000_00 },
        { type: 'service', title: 'JAMB prep', cat: 'exam-prep', desc: 'Focused exam preparation.', starting: 30_000_00 },
      ],
    },
    {
      name: 'Blessing Adeyemi',
      phone: '08055550005',
      headline: 'Makeup artist · Victoria Island',
      bio: 'Bridal, party and event makeup. On-location available.',
      city: 'Victoria Island, Lagos',
      radius: 18,
      starting: 20_000_00,
      jobs: 150,
      rating: 4.9,
      reviews: 300,
      listings: [
        { type: 'service', title: 'Event makeup', cat: 'makeup', desc: 'Full event makeup.', starting: 20_000_00 },
        { type: 'service', title: 'Bridal makeup', cat: 'beauty', desc: 'Bridal packages.', starting: 80_000_00 },
      ],
    },
  ];

  for (const p of providers) {
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.phone, p.phone))
      .limit(1);
    if (existing.length > 0) {
      console.log(`skip existing provider ${p.name}`);
      continue;
    }
    const userId = id('usr');
    await db.insert(schema.users).values({
      id: userId,
      displayName: p.name,
      phone: p.phone,
      passwordHash,
      isProvider: 1,
      locationCity: p.city,
      ratingAvg: p.rating,
      reviewCount: p.reviews,
      verificationStatus: 'verified',
    });
    const profileId = id('prf');
    await db.insert(schema.providerProfiles).values({
      id: profileId,
      userId,
      headline: p.headline,
      bio: p.bio,
      areaCity: p.city,
      areaRadiusKm: p.radius,
      startingPriceKobo: p.starting,
      completedJobs: p.jobs,
      verificationStatus: 'verified',
      responseRate: 0.96,
      responseTimeMin: 45,
      availability: [
        { day: 'monday', start: '08:00', end: '18:00' },
        { day: 'tuesday', start: '08:00', end: '18:00' },
        { day: 'wednesday', start: '08:00', end: '18:00' },
        { day: 'thursday', start: '08:00', end: '18:00' },
        { day: 'friday', start: '08:00', end: '15:00' },
        { day: 'saturday', start: '09:00', end: '13:00' },
      ],
    });
    for (const l of p.listings) {
      await db.insert(schema.listings).values({
        id: id('lst'),
        providerId: userId,
        listingType: l.type,
        title: l.title,
        description: l.desc,
        priceKobo: l.starting,
        priceType: 'starting',
        condition: l.type === 'product' ? 'used' : 'any',
        categoryId: categoryIds.get(l.cat),
        locationCity: p.city,
        status: 'active',
        images: [] as string[],
        delivery: { localPickup: true, deliveryAvailable: false },
      });
    }
  }

  console.log(`seed complete: ${seedCategories.length} parent categories, ${providers.length} providers`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});