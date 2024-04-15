import {
  varchar,
  primaryKey,
  pgTable,
  uuid,
  boolean,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const PROVIDER_TYPES = ["EMAIL", "PHONE", "SYSADMIN", "GOOGLE", "DISCORD"] as const;
export const providers = pgEnum("providers", PROVIDER_TYPES);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
});

export const authKey = pgTable(
  "auth_key",
  {
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    provider: providers("provider").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    hashedPassword: text("hashed_password"),
    verified: boolean("verified").default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.provider, table.providerUserId] }),
    };
  },
);

export const session = pgTable("session", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(), // used as token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  activeExpires: timestamp("active_expires", {
    withTimezone: true,
    precision: 3,
    mode: "date",
  }).notNull(),
  idleExpires: timestamp("idle_expires", {
    withTimezone: true,
    precision: 3,
    mode: "date",
  }).notNull(),
});

import { relations } from "drizzle-orm";

export const userRelations = relations(users, ({ many, one }) => {
  return {
    keys: many(authKey),
    sessions: many(session),
    authKeys: many(authKey),
  };
});

export const authKeyRelations = relations(authKey, ({ one }) => {
  return {
    user: one(users, {
      fields: [authKey.userId],
      references: [users.id],
    }),
  };
});

export const sessionRelations = relations(session, ({ one }) => {
  return {
    user: one(users, {
      fields: [session.userId],
      references: [users.id],
    }),
  };
});

export const schemas = {
  users,
  authKey,
  session,
  userRelations,
  authKeyRelations,
  sessionRelations,
};

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const queryClient = postgres("postgres://username:password@localhost:5432/db_name");

export const db = drizzle(queryClient, {
  schema: schemas,
  logger: true,
});
