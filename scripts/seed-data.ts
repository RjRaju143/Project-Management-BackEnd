/**
 * Script to seed 100 leads and 100 projects into the database.
 *
 * Usage:
 *   npm run seed-data
 *
 * Requires at least one user in the DB (run create-user first).
 */

import mongoose from "mongoose";

import Client from "../src/models/client.js";
import Lead from "../src/models/lead.js";
import User from "../src/models/user.js";

const CLIENT_STATUSES = ["Inactive", "Active", "Proposed", "On Hold", "Started", "Closed"] as const;
const LEAD_STATUSES = ["Pending", "Started", "On Hold", "Completed", "Closed"] as const;

const COMPANIES = [
  "TechNova Solutions", "Pinnacle Systems", "BlueWave Digital", "Vertex Labs", "CoreStack India",
  "Infinitech Global", "Redline Dynamics", "NextGen Software", "CloudBridge IT", "ZenithPro Services",
  "AgileMind Tech", "DataPulse Analytics", "CyberNest Security", "QuantumLeap AI", "FusionWare Labs",
  "BrightEdge Digital", "SwiftCode Solutions", "NeoLogic Systems", "GreenByte Tech", "PrimeAxis IT",
  "StarGrid Networks", "OmniCore Solutions", "PixelCraft Studio", "VelocityTech Labs", "AlphaWave Digital",
  "SilverLine Systems", "IronClad Security", "DeepRoot Analytics", "SkySpark Innovations", "MetaForge Tech",
  "ClearView Software", "RapidScale IT", "TrueNorth Digital", "PeakLogic Solutions", "WavePoint Tech",
  "BoldStack Labs", "InfiniteLoop IT", "CodeCraft India", "SmartPulse Systems", "TitanEdge Solutions",
  "FlexiCore Tech", "Catalyst Digital", "SignalPath Networks", "ProtonWare Labs", "Meridian IT Services",
  "HorizonX Tech", "EchoSoft Solutions", "VantagePoint Digital", "NimbleTech Labs", "CircuitMind AI",
];

const NAMES = [
  "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
  "Anita Desai", "Suresh Nair", "Kavita Joshi", "Manoj Gupta", "Deepa Menon",
  "Rahul Verma", "Pooja Iyer", "Sanjay Rao", "Meera Bhat", "Arun Pillai",
  "Divya Kapoor", "Karthik Rajan", "Neha Saxena", "Prasad Hegde", "Swati Kulkarni",
  "Ravi Tiwari", "Sunita Mohan", "Vivek Choudhury", "Lakshmi Venkat", "Nitin Aggarwal",
];

const LOCATIONS = [
  "Mumbai, Maharashtra", "Bangalore, Karnataka", "Hyderabad, Telangana", "Chennai, Tamil Nadu",
  "Pune, Maharashtra", "Delhi NCR", "Kolkata, West Bengal", "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Kochi, Kerala", "Chandigarh, Punjab",
  "Vizag, Andhra Pradesh", "Indore, Madhya Pradesh", "Coimbatore, Tamil Nadu",
  "Noida, Uttar Pradesh", "Gurgaon, Haryana", "Bhubaneswar, Odisha", "Nagpur, Maharashtra",
  "Thiruvananthapuram, Kerala",
];

const BUSINESS_TYPES = [
  "IT Services", "E-Commerce", "FinTech", "HealthTech", "EdTech",
  "Manufacturing", "Retail", "Real Estate", "Logistics", "Media & Entertainment",
  "SaaS", "Consulting", "Telecom", "Agriculture", "Hospitality",
];

const TIMELINES = [
  "1 month", "2 months", "3 months", "4 months", "6 months",
  "8 months", "1 year", "2 weeks", "45 days", "90 days",
];

const PINCODES = [
  "400001", "560001", "500001", "600001", "411001",
  "110001", "700001", "380001", "302001", "226001",
  "682001", "160001", "530001", "452001", "641001",
  "201301", "122001", "751001", "440001", "695001",
];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randPhone(): string {
  return `${7 + Math.floor(Math.random() * 3)}${String(Math.floor(Math.random() * 1000000000)).padStart(9, "0")}`;
}

function randAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) / 1000) * 1000;
}

function randDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d;
}

async function main() {
  // eslint-disable-next-line node/no-process-env
  const mongoUri = process.env.MONGODB_URI;
  console.log(`\nConnecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri!);
  console.log("Connected.\n");

  // Get first user
  const user = await User.findOne();
  if (!user) {
    console.error("✗ No users found. Run 'npm run create-user' first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const userId = (user._id as { toString: () => string }).toString();
  console.log(`Using user: ${user.username} (${userId})\n`);

  // Seed 100 leads (clients)
  console.log("Seeding 100 leads...");
  const leads = [];
  for (let i = 0; i < 100; i++) {
    const status = rand(CLIENT_STATUSES);
    leads.push({
      clientName: rand(NAMES),
      organizationName: rand(COMPANIES),
      location: rand(LOCATIONS),
      businessType: rand(BUSINESS_TYPES),
      phone: randPhone(),
      pincode: rand(PINCODES),
      budget: randAmount(50000, 2000000),
      amount: randAmount(25000, 1500000),
      status,
      timeline: rand(TIMELINES),
      description: `Lead entry for ${rand(COMPANIES)} - ${rand(BUSINESS_TYPES)} project.`,
      followedUp: status === "Started",
      user: userId,
      createdAt: randDate(90),
    });
  }
  await Client.insertMany(leads);
  console.log("✓ 100 leads created.\n");

  // Seed 100 projects (from lead model)
  console.log("Seeding 100 projects...");
  const projects = [];
  for (let i = 0; i < 100; i++) {
    const status = rand(LEAD_STATUSES);
    const createdAt = randDate(60);
    const startedAt = (status === "Started" || status === "Completed" || status === "Closed")
      ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      : null;
    const completedAt = (status === "Completed" || status === "Closed") && startedAt
      ? new Date(startedAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      : null;

    projects.push({
      clientName: rand(NAMES),
      organizationName: rand(COMPANIES),
      location: rand(LOCATIONS),
      businessType: rand(BUSINESS_TYPES),
      phone: randPhone(),
      pincode: rand(PINCODES),
      budget: randAmount(100000, 5000000),
      amount: randAmount(75000, 4000000),
      status,
      timeline: rand(TIMELINES),
      description: `Project for ${rand(COMPANIES)} - ${rand(BUSINESS_TYPES)}.`,
      statusChangeReason: "",
      startedAt,
      completedAt,
      user: userId,
      createdAt,
    });
  }
  await Lead.insertMany(projects);
  console.log("✓ 100 projects created.\n");

  console.log("Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
