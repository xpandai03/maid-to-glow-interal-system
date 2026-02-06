import {
  type Customer, type InsertCustomer,
  type Subscription, type InsertSubscription,
  type Job, type InsertJob,
  type TimeLog, type InsertTimeLog,
  customers, subscriptions, jobs, timeLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(data).returning();
    return c;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions);
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [s] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return s;
  }

  async createSubscription(data: InsertSubscription): Promise<Subscription> {
    const [s] = await db.insert(subscriptions).values(data).returning();
    return s;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const [s] = await db.update(subscriptions).set({ status: "cancelled" }).where(eq(subscriptions.id, id)).returning();
    if (s) {
      await db.update(jobs).set({ status: "cancelled" }).where(eq(jobs.subscriptionId, id));
    }
    return s;
  }

  async getSubscriptionJobs(subscriptionId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.subscriptionId, subscriptionId));
  }

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.scheduledDate));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [j] = await db.select().from(jobs).where(eq(jobs.id, id));
    return j;
  }

  async createJob(data: InsertJob): Promise<Job> {
    const [j] = await db.insert(jobs).values(data).returning();
    return j;
  }

  async getJobsByDate(date: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.scheduledDate, date));
  }

  async getTimeLogs(): Promise<TimeLog[]> {
    return db.select().from(timeLogs).orderBy(desc(timeLogs.id));
  }

  async getTimeLog(id: string): Promise<TimeLog | undefined> {
    const [t] = await db.select().from(timeLogs).where(eq(timeLogs.id, id));
    return t;
  }

  async createTimeLog(data: InsertTimeLog): Promise<TimeLog> {
    const [t] = await db.insert(timeLogs).values(data).returning();
    return t;
  }

  async clockOut(id: string): Promise<TimeLog | undefined> {
    const [t] = await db.update(timeLogs).set({ clockOutTime: new Date().toISOString() }).where(eq(timeLogs.id, id)).returning();
    return t;
  }
}

export const storage = new DatabaseStorage();
