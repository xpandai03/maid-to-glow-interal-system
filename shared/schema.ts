import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  frequency: text("frequency").notNull(), // weekly | biweekly | monthly
  startDate: text("start_date").notNull(),
  status: text("status").notNull().default("active"), // active | paused | cancelled
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  subscriptionId: varchar("subscription_id"),
  scheduledDate: text("scheduled_date").notNull(),
  arrivalWindow: text("arrival_window").notNull(),
  priceSnapshot: real("price_snapshot").notNull(),
  extrasSnapshot: jsonb("extras_snapshot").notNull().default(sql`'[]'::jsonb`),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  sqft: integer("sqft").notNull().default(0),
  frequency: text("frequency").notNull().default("one-time"),
  status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const timeLogs = pgTable("time_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  clockInTime: text("clock_in_time"),
  clockOutTime: text("clock_out_time"),
  lat: real("lat"),
  lng: real("lng"),
});

export const insertTimeLogSchema = createInsertSchema(timeLogs).omit({ id: true });
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;
export type TimeLog = typeof timeLogs.$inferSelect;

export const PRICING_CONFIG = {
  pricePerBedroom: 35,
  pricePerBathroom: 25,
  sqftRanges: [
    { min: 0, max: 500, price: 60 },
    { min: 501, max: 1000, price: 90 },
    { min: 1001, max: 1500, price: 120 },
    { min: 1501, max: 2000, price: 150 },
    { min: 2001, max: 2500, price: 180 },
    { min: 2501, max: 99999, price: 210 },
  ],
  extras: [
    { id: "deep-clean", name: "Deep Clean", price: 50 },
    { id: "inside-fridge", name: "Inside Fridge", price: 30 },
    { id: "inside-oven", name: "Inside Oven", price: 30 },
    { id: "inside-cabinets", name: "Inside Cabinets", price: 40 },
    { id: "laundry", name: "Laundry (Wash & Fold)", price: 25 },
    { id: "windows", name: "Interior Windows", price: 35 },
  ],
  frequencyDiscounts: {
    "one-time": 0,
    weekly: 0.20,
    biweekly: 0.10,
    monthly: 0.05,
  } as Record<string, number>,
};

export function calculatePrice(
  bedrooms: number,
  bathrooms: number,
  sqft: number,
  frequency: string,
  extraIds: string[]
): number {
  const bedroomCost = bedrooms * PRICING_CONFIG.pricePerBedroom;
  const bathroomCost = bathrooms * PRICING_CONFIG.pricePerBathroom;

  const sqftRange = PRICING_CONFIG.sqftRanges.find(
    (r) => sqft >= r.min && sqft <= r.max
  );
  const sqftCost = sqftRange ? sqftRange.price : 210;

  const extrasCost = extraIds.reduce((sum, id) => {
    const extra = PRICING_CONFIG.extras.find((e) => e.id === id);
    return sum + (extra ? extra.price : 0);
  }, 0);

  const subtotal = bedroomCost + bathroomCost + sqftCost + extrasCost;
  const discount = PRICING_CONFIG.frequencyDiscounts[frequency] || 0;
  const total = subtotal * (1 - discount);

  return Math.round(total * 100) / 100;
}
