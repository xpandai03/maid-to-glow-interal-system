import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { calculatePrice, PRICING_CONFIG } from "@shared/schema";

const createJobSchema = z.object({
  customerId: z.string().min(1),
  scheduledDate: z.string().min(1),
  arrivalWindow: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqft: z.number().int().min(0),
  frequency: z.enum(["one-time", "weekly", "biweekly", "monthly"]),
  extraIds: z.array(z.string()).default([]),
  subscriptionId: z.string().optional(),
});

const clockInSchema = z.object({
  jobId: z.string().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/customers", async (_req, res) => {
    const data = await storage.getCustomers();
    res.json(data);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const data = await storage.getCustomer(req.params.id);
    if (!data) return res.status(404).json({ message: "Customer not found" });
    res.json(data);
  });

  app.get("/api/jobs", async (_req, res) => {
    const data = await storage.getJobs();
    res.json(data);
  });

  app.get("/api/jobs/today", async (_req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const data = await storage.getJobsByDate(today);
    res.json(data);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const data = await storage.getJob(req.params.id);
    if (!data) return res.status(404).json({ message: "Job not found" });
    res.json(data);
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const parsed = createJobSchema.parse(req.body);

      const customer = await storage.getCustomer(parsed.customerId);
      if (!customer) return res.status(400).json({ message: "Customer not found" });

      const priceSnapshot = calculatePrice(
        parsed.bedrooms,
        parsed.bathrooms,
        parsed.sqft,
        parsed.frequency,
        parsed.extraIds
      );

      const extrasSnapshot = parsed.extraIds
        .map((id) => PRICING_CONFIG.extras.find((e) => e.id === id))
        .filter(Boolean);

      const data = await storage.createJob({
        customerId: parsed.customerId,
        subscriptionId: parsed.subscriptionId || null,
        scheduledDate: parsed.scheduledDate,
        arrivalWindow: parsed.arrivalWindow,
        priceSnapshot,
        extrasSnapshot,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        sqft: parsed.sqft,
        frequency: parsed.frequency,
        status: "scheduled",
      });
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      }
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/subscriptions", async (_req, res) => {
    const data = await storage.getSubscriptions();
    res.json(data);
  });

  app.get("/api/subscriptions/:id", async (req, res) => {
    const data = await storage.getSubscription(req.params.id);
    if (!data) return res.status(404).json({ message: "Subscription not found" });
    res.json(data);
  });

  app.get("/api/subscriptions/:id/jobs", async (req, res) => {
    const data = await storage.getSubscriptionJobs(req.params.id);
    res.json(data);
  });

  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    const data = await storage.cancelSubscription(req.params.id);
    if (!data) return res.status(404).json({ message: "Subscription not found" });
    res.json(data);
  });

  app.get("/api/timelogs", async (_req, res) => {
    const data = await storage.getTimeLogs();
    res.json(data);
  });

  app.post("/api/timelogs/clock-in", async (req, res) => {
    try {
      const parsed = clockInSchema.parse(req.body);

      const job = await storage.getJob(parsed.jobId);
      if (!job) return res.status(400).json({ message: "Job not found" });

      const data = await storage.createTimeLog({
        jobId: parsed.jobId,
        clockInTime: new Date().toISOString(),
        clockOutTime: null,
        lat: parsed.lat || null,
        lng: parsed.lng || null,
      });
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
      }
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/timelogs/:id/clock-out", async (req, res) => {
    const data = await storage.clockOut(req.params.id);
    if (!data) return res.status(404).json({ message: "Time log not found" });
    res.json(data);
  });

  return httpServer;
}
