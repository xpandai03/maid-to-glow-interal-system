import { db } from "./db";
import { customers, subscriptions, jobs, timeLogs } from "@shared/schema";
import { calculatePrice, PRICING_CONFIG } from "@shared/schema";

export async function seedDatabase() {
  const existingCustomers = await db.select().from(customers);
  if (existingCustomers.length > 0) return;

  console.log("Seeding database...");

  const [c1] = await db.insert(customers).values({ name: "Sarah Johnson", address: "123 Oak Lane, Austin, TX 78701" }).returning();
  const [c2] = await db.insert(customers).values({ name: "Mike Chen", address: "456 Elm Street, Austin, TX 78704" }).returning();
  const [c3] = await db.insert(customers).values({ name: "Lisa Martinez", address: "789 Pine Ave, Austin, TX 78731" }).returning();
  const [c4] = await db.insert(customers).values({ name: "David Wilson", address: "321 Maple Drive, Austin, TX 78745" }).returning();
  const [c5] = await db.insert(customers).values({ name: "Emma Brown", address: "654 Cedar Blvd, Austin, TX 78757" }).returning();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  function dateOffset(days: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  const [sub1] = await db.insert(subscriptions).values({
    customerId: c1.id,
    frequency: "weekly",
    startDate: dateOffset(-14),
    status: "active",
  }).returning();

  const [sub2] = await db.insert(subscriptions).values({
    customerId: c2.id,
    frequency: "biweekly",
    startDate: dateOffset(-28),
    status: "active",
  }).returning();

  const [sub3] = await db.insert(subscriptions).values({
    customerId: c3.id,
    frequency: "monthly",
    startDate: dateOffset(-60),
    status: "cancelled",
  }).returning();

  const price1 = calculatePrice(3, 2, 1500, "weekly", ["deep-clean"]);
  const price2 = calculatePrice(2, 1, 900, "biweekly", []);
  const price3 = calculatePrice(4, 3, 2200, "monthly", ["inside-fridge", "inside-oven"]);

  const extras1 = [PRICING_CONFIG.extras.find(e => e.id === "deep-clean")!];
  const extras3 = [
    PRICING_CONFIG.extras.find(e => e.id === "inside-fridge")!,
    PRICING_CONFIG.extras.find(e => e.id === "inside-oven")!,
  ];

  // Sub1 weekly jobs (past + future)
  for (let i = -2; i <= 5; i++) {
    await db.insert(jobs).values({
      customerId: c1.id,
      subscriptionId: sub1.id,
      scheduledDate: dateOffset(i * 7),
      arrivalWindow: "9:00 AM - 11:00 AM",
      priceSnapshot: price1,
      extrasSnapshot: extras1,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      frequency: "weekly",
      status: i < 0 ? "completed" : "scheduled",
    });
  }

  // Sub2 biweekly jobs
  for (let i = -1; i <= 3; i++) {
    await db.insert(jobs).values({
      customerId: c2.id,
      subscriptionId: sub2.id,
      scheduledDate: dateOffset(i * 14 + 1),
      arrivalWindow: "1:00 PM - 3:00 PM",
      priceSnapshot: price2,
      extrasSnapshot: [],
      bedrooms: 2,
      bathrooms: 1,
      sqft: 900,
      frequency: "biweekly",
      status: i < 0 ? "completed" : "scheduled",
    });
  }

  // Sub3 monthly jobs (cancelled)
  for (let i = 0; i < 3; i++) {
    await db.insert(jobs).values({
      customerId: c3.id,
      subscriptionId: sub3.id,
      scheduledDate: dateOffset(i * 30 + 2),
      arrivalWindow: "10:00 AM - 12:00 PM",
      priceSnapshot: price3,
      extrasSnapshot: extras3,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2200,
      frequency: "monthly",
      status: "cancelled",
    });
  }

  // One-time jobs
  const priceOneTime = calculatePrice(2, 2, 1200, "one-time", ["windows"]);
  await db.insert(jobs).values({
    customerId: c4.id,
    scheduledDate: todayStr,
    arrivalWindow: "2:00 PM - 4:00 PM",
    priceSnapshot: priceOneTime,
    extrasSnapshot: [PRICING_CONFIG.extras.find(e => e.id === "windows")!],
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    frequency: "one-time",
    status: "scheduled",
  });

  const priceOneTime2 = calculatePrice(3, 1, 1000, "one-time", []);
  await db.insert(jobs).values({
    customerId: c5.id,
    scheduledDate: todayStr,
    arrivalWindow: "9:00 AM - 11:00 AM",
    priceSnapshot: priceOneTime2,
    extrasSnapshot: [],
    bedrooms: 3,
    bathrooms: 1,
    sqft: 1000,
    frequency: "one-time",
    status: "scheduled",
  });

  // Add a completed time log for a past job
  const pastJobs = await db.select().from(jobs);
  const completedJob = pastJobs.find(j => j.status === "completed");
  if (completedJob) {
    await db.insert(timeLogs).values({
      jobId: completedJob.id,
      clockInTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      lat: 30.2672,
      lng: -97.7431,
    });
  }

  console.log("Seed data inserted successfully.");
}
