import {
  type Customer, type InsertCustomer,
  type Subscription, type InsertSubscription,
  type Job, type InsertJob,
  type TimeLog, type InsertTimeLog,
  calculatePrice, PRICING_CONFIG,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;

  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  createSubscription(data: InsertSubscription): Promise<Subscription>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionJobs(subscriptionId: string): Promise<Job[]>;

  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(data: InsertJob): Promise<Job>;
  getJobsByDate(date: string): Promise<Job[]>;

  getTimeLogs(): Promise<TimeLog[]>;
  getTimeLog(id: string): Promise<TimeLog | undefined>;
  createTimeLog(data: InsertTimeLog): Promise<TimeLog>;
  clockOut(id: string): Promise<TimeLog | undefined>;
}

// ─── Helpers ───────────────────────────────────────────────
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const todayStr = new Date().toISOString().split("T")[0];
const uid = () => randomUUID();

// ─── Seed customers ────────────────────────────────────────
const demoCustomers: Customer[] = [
  { id: uid(), name: "Sarah Johnson", address: "123 Oak Lane, Austin, TX 78701" },
  { id: uid(), name: "Mike Chen", address: "456 Elm Street, Austin, TX 78704" },
  { id: uid(), name: "Lisa Martinez", address: "789 Pine Ave, Austin, TX 78731" },
  { id: uid(), name: "David Wilson", address: "321 Maple Drive, Austin, TX 78745" },
  { id: uid(), name: "Emma Brown", address: "654 Cedar Blvd, Austin, TX 78757" },
  { id: uid(), name: "Rachel Green", address: "100 Central Park West, Austin, TX 78702" },
  { id: uid(), name: "Tom Baker", address: "88 Sunset Blvd, Austin, TX 78703" },
  { id: uid(), name: "Nina Patel", address: "55 River Road, Austin, TX 78741" },
  { id: uid(), name: "James Lee", address: "22 Hilltop Ct, Austin, TX 78759" },
  { id: uid(), name: "Olivia Kim", address: "410 Lakewood Dr, Austin, TX 78746" },
];

// ─── Seed subscriptions ────────────────────────────────────
const demoSubscriptions: Subscription[] = [
  { id: uid(), customerId: demoCustomers[0].id, frequency: "weekly", startDate: dateOffset(-21), status: "active" },
  { id: uid(), customerId: demoCustomers[1].id, frequency: "biweekly", startDate: dateOffset(-28), status: "active" },
  { id: uid(), customerId: demoCustomers[2].id, frequency: "monthly", startDate: dateOffset(-60), status: "cancelled" },
  { id: uid(), customerId: demoCustomers[5].id, frequency: "weekly", startDate: dateOffset(-14), status: "active" },
  { id: uid(), customerId: demoCustomers[6].id, frequency: "biweekly", startDate: dateOffset(-42), status: "paused" },
  { id: uid(), customerId: demoCustomers[7].id, frequency: "monthly", startDate: dateOffset(-30), status: "active" },
];

// ─── Seed jobs ─────────────────────────────────────────────
const windows = [
  "8:00 AM - 10:00 AM",
  "9:00 AM - 11:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "2:00 PM - 4:00 PM",
  "3:00 PM - 5:00 PM",
];

const demoJobs: Job[] = [];

function addJob(
  custIdx: number,
  subIdx: number | null,
  date: string,
  windowIdx: number,
  bed: number,
  bath: number,
  sqft: number,
  freq: string,
  extraIds: string[],
  status: string,
) {
  const price = calculatePrice(bed, bath, sqft, freq, extraIds);
  const extras = extraIds
    .map((id) => PRICING_CONFIG.extras.find((e) => e.id === id))
    .filter(Boolean);
  demoJobs.push({
    id: uid(),
    customerId: demoCustomers[custIdx].id,
    subscriptionId: subIdx !== null ? demoSubscriptions[subIdx].id : null,
    scheduledDate: date,
    arrivalWindow: windows[windowIdx],
    priceSnapshot: price,
    extrasSnapshot: extras,
    bedrooms: bed,
    bathrooms: bath,
    sqft,
    frequency: freq,
    status,
  });
}

// ── Current week: lots of jobs spread across every day ──
// Figure out what day offset Sunday is for current week
const now = new Date();
const dayOfWeek = now.getDay(); // 0=Sun
const sundayOffset = -dayOfWeek;

// SUN – 2 jobs
addJob(0, 0, dateOffset(sundayOffset), 1, 3, 2, 1500, "weekly", ["deep-clean"], "completed");
addJob(7, 5, dateOffset(sundayOffset), 4, 2, 2, 1400, "monthly", [], "completed");

// MON – 3 jobs
addJob(1, 1, dateOffset(sundayOffset + 1), 0, 2, 1, 900, "biweekly", [], "completed");
addJob(5, 3, dateOffset(sundayOffset + 1), 2, 3, 2, 1600, "weekly", ["inside-fridge"], "completed");
addJob(8, null, dateOffset(sundayOffset + 1), 4, 4, 3, 2200, "one-time", ["windows", "laundry"], "completed");

// TUE – 2 jobs
addJob(3, null, dateOffset(sundayOffset + 2), 1, 2, 2, 1200, "one-time", ["windows"], "completed");
addJob(9, null, dateOffset(sundayOffset + 2), 3, 3, 2, 1800, "one-time", ["deep-clean", "inside-oven"], "scheduled");

// WED – 3 jobs
addJob(0, 0, dateOffset(sundayOffset + 3), 0, 3, 2, 1500, "weekly", ["deep-clean"], "scheduled");
addJob(4, null, dateOffset(sundayOffset + 3), 2, 3, 1, 1000, "one-time", [], "scheduled");
addJob(6, 4, dateOffset(sundayOffset + 3), 4, 2, 1, 850, "biweekly", [], "cancelled");

// THU (today-ish) – 4 jobs
addJob(2, 2, dateOffset(sundayOffset + 4), 0, 4, 3, 2200, "monthly", ["inside-fridge", "inside-oven"], "cancelled");
addJob(5, 3, dateOffset(sundayOffset + 4), 1, 3, 2, 1600, "weekly", ["inside-fridge"], "scheduled");
addJob(7, 5, dateOffset(sundayOffset + 4), 3, 2, 2, 1400, "monthly", [], "scheduled");
addJob(9, null, dateOffset(sundayOffset + 4), 5, 2, 1, 800, "one-time", ["laundry"], "scheduled");

// FRI – 3 jobs
addJob(1, 1, dateOffset(sundayOffset + 5), 1, 2, 1, 900, "biweekly", [], "scheduled");
addJob(3, null, dateOffset(sundayOffset + 5), 3, 2, 2, 1200, "one-time", ["windows"], "scheduled");
addJob(8, null, dateOffset(sundayOffset + 5), 0, 4, 3, 2200, "one-time", ["deep-clean", "inside-cabinets"], "scheduled");

// SAT – 3 jobs
addJob(0, 0, dateOffset(sundayOffset + 6), 1, 3, 2, 1500, "weekly", ["deep-clean"], "scheduled");
addJob(4, null, dateOffset(sundayOffset + 6), 3, 3, 1, 1000, "one-time", [], "scheduled");
addJob(6, 4, dateOffset(sundayOffset + 6), 0, 2, 1, 850, "biweekly", [], "scheduled");

// ── Past week jobs (last week) ──
addJob(0, 0, dateOffset(sundayOffset - 7), 1, 3, 2, 1500, "weekly", ["deep-clean"], "completed");
addJob(5, 3, dateOffset(sundayOffset - 6), 2, 3, 2, 1600, "weekly", ["inside-fridge"], "completed");
addJob(1, 1, dateOffset(sundayOffset - 5), 0, 2, 1, 900, "biweekly", [], "completed");
addJob(3, null, dateOffset(sundayOffset - 4), 1, 2, 2, 1200, "one-time", ["windows"], "completed");
addJob(7, 5, dateOffset(sundayOffset - 3), 4, 2, 2, 1400, "monthly", [], "completed");
addJob(9, null, dateOffset(sundayOffset - 2), 3, 3, 2, 1800, "one-time", [], "completed");

// ── Next week jobs ──
addJob(0, 0, dateOffset(sundayOffset + 10), 1, 3, 2, 1500, "weekly", ["deep-clean"], "scheduled");
addJob(5, 3, dateOffset(sundayOffset + 8), 2, 3, 2, 1600, "weekly", ["inside-fridge"], "scheduled");
addJob(1, 1, dateOffset(sundayOffset + 12), 0, 2, 1, 900, "biweekly", [], "scheduled");
addJob(7, 5, dateOffset(sundayOffset + 9), 4, 2, 2, 1400, "monthly", [], "scheduled");

// ── Today-specific jobs for tech clock-in ──
const todayJobIds: string[] = [];
// Ensure some jobs exist for today specifically
const todayHasJobs = demoJobs.some((j) => j.scheduledDate === todayStr);
if (!todayHasJobs) {
  addJob(4, null, todayStr, 1, 3, 1, 1000, "one-time", [], "scheduled");
  addJob(8, null, todayStr, 3, 4, 3, 2200, "one-time", ["deep-clean"], "scheduled");
  addJob(2, 2, todayStr, 0, 4, 3, 2200, "monthly", ["inside-fridge", "inside-oven"], "scheduled");
}

// ─── Seed time logs ────────────────────────────────────────
const completedJobs = demoJobs.filter((j) => j.status === "completed");
const demoTimeLogs: TimeLog[] = [];

// Create time logs for completed jobs
completedJobs.slice(0, 8).forEach((job, i) => {
  const clockIn = new Date();
  clockIn.setDate(clockIn.getDate() - (10 - i));
  clockIn.setHours(8 + (i % 4), 0, 0, 0);
  const clockOut = new Date(clockIn);
  clockOut.setHours(clockIn.getHours() + 2 + (i % 2));

  demoTimeLogs.push({
    id: uid(),
    jobId: job.id,
    clockInTime: clockIn.toISOString(),
    clockOutTime: clockOut.toISOString(),
    lat: 30.2672 + (Math.random() - 0.5) * 0.02,
    lng: -97.7431 + (Math.random() - 0.5) * 0.02,
  });
});

// ─── In-memory storage ────────────────────────────────────
class InMemoryStorage implements IStorage {
  private customers: Customer[] = [...demoCustomers];
  private subscriptions: Subscription[] = [...demoSubscriptions];
  private jobs: Job[] = [...demoJobs];
  private timeLogs: TimeLog[] = [...demoTimeLogs];

  async getCustomers() { return this.customers; }
  async getCustomer(id: string) { return this.customers.find((c) => c.id === id); }
  async createCustomer(data: InsertCustomer) {
    const c: Customer = { id: uid(), ...data };
    this.customers.push(c);
    return c;
  }

  async getSubscriptions() { return this.subscriptions; }
  async getSubscription(id: string) { return this.subscriptions.find((s) => s.id === id); }
  async createSubscription(data: InsertSubscription) {
    const s: Subscription = { id: uid(), ...data };
    this.subscriptions.push(s);
    return s;
  }
  async cancelSubscription(id: string) {
    const s = this.subscriptions.find((s) => s.id === id);
    if (!s) return undefined;
    s.status = "cancelled";
    this.jobs.filter((j) => j.subscriptionId === id && j.status === "scheduled")
      .forEach((j) => { j.status = "cancelled"; });
    return s;
  }
  async getSubscriptionJobs(subscriptionId: string) {
    return this.jobs.filter((j) => j.subscriptionId === subscriptionId);
  }

  async getJobs() {
    return [...this.jobs].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }
  async getJob(id: string) { return this.jobs.find((j) => j.id === id); }
  async createJob(data: InsertJob) {
    const j: Job = { id: uid(), ...data } as Job;
    this.jobs.push(j);
    return j;
  }
  async getJobsByDate(date: string) {
    return this.jobs.filter((j) => j.scheduledDate === date);
  }

  async getTimeLogs() {
    return [...this.timeLogs].sort((a, b) => (b.clockInTime || "").localeCompare(a.clockInTime || ""));
  }
  async getTimeLog(id: string) { return this.timeLogs.find((t) => t.id === id); }
  async createTimeLog(data: InsertTimeLog) {
    const t: TimeLog = { id: uid(), ...data } as TimeLog;
    this.timeLogs.push(t);
    return t;
  }
  async clockOut(id: string) {
    const t = this.timeLogs.find((t) => t.id === id);
    if (!t) return undefined;
    t.clockOutTime = new Date().toISOString();
    return t;
  }
}

export const storage = new InMemoryStorage();
