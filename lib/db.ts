import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var pgPool: Pool | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const pool =
    global.pgPool ??
    new Pool({
      connectionString,
      max: 10,
      ssl: false,
    });
  const adapter = new PrismaPg(pool);
  const client =
    global.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    global.pgPool = pool;
    global.prisma = client;
  }

  return client;
}

let prismaClient: PrismaClient | undefined;

function getPrismaClient() {
  prismaClient ??= createPrismaClient();
  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
