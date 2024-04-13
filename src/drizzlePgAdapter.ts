import { type Adapter } from "./adapter";
import { db } from "./exampleSchema";
import { and, eq, notInArray } from "drizzle-orm";
import { users, authKey, session } from "./exampleSchema";

export const drizzlePgAdapter: Adapter<
  "id",
  typeof users.$inferSelect,
  typeof users.$inferInsert,
  "userId",
  "provider",
  "providerUserId",
  typeof authKey.$inferSelect,
  typeof authKey.$inferInsert,
  "id",
  typeof session.$inferSelect,
  typeof session.$inferSelect,
  typeof db
> = {
  getUser: async (userId) => {
    const databaseUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return databaseUser ?? null;
  },
  setUser: async (user, key, transaction) => {
    const trx = transaction ?? db;
    if (!key) {
      const databaseUser = (
        await trx
          .insert(users)
          .values({
            ...user,
          })
          .returning()
      )[0]; // prob no need to check index as it should throw in case
      if (!databaseUser) throw new Error("Couldn't create user");
      return databaseUser;
    }

    const databaseUser = (
      await trx
        .insert(users)
        .values({
          ...user,
        })
        .returning()
    )[0]; // prob no need to check index as it should throw in case
    if (!databaseUser) throw new Error("Couldn't create user");

    const databaseKey = (
      await trx
        .insert(authKey)
        .values({
          ...key,
          userId: databaseUser.id,
        })
        .returning()
    )[0];
    if (!databaseKey) throw new Error("Couldn't create key");

    return databaseUser;
  },
  updateUser: async (userId, partialUser) => {
    const databaseUser = (
      await db
        .update(users)
        .set({
          ...partialUser,
        })
        .where(eq(users.id, userId))
        .returning()
    )[0];
    if (!databaseUser) throw new Error("Couldn't update user");
    return databaseUser;
  },
  deleteUser: async (userId) => {
    // order here is very important, no transaction required
    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(authKey).where(eq(authKey.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  },
  getKey: async (providerId, providerUserId) => {
    const databaseKey = await db.query.authKey.findFirst({
      where: and(
        eq(authKey.provider, providerId),
        eq(authKey.providerUserId, providerUserId),
      ),
    });

    return databaseKey ?? null;
  },
  getSessionAndUser: async (sessionId) => {
    const databaseSession = await db.query.session.findFirst({
      where: eq(session.id, sessionId),
      with: {
        user: true,
      },
    });

    if (!databaseSession?.user) return null;
    return { session: databaseSession, user: databaseSession.user };
  },
  getSessionsByUserId: async (userId) => {
    const databaseSessions = await db.query.session.findMany({
      where: eq(session.userId, userId),
    });
    return databaseSessions;
  },
  updateSession: async (sessionId, partialSession) => {
    const databaseSession = await db
      .update(session)
      .set(partialSession)
      .where(eq(session.id, sessionId))
      .returning();
    if (!databaseSession[0]) throw new Error("Couldn't update session");
    return databaseSession[0];
  },
  setSession: async (sessionInput) => {
    const databaseSession = (
      await db
        .insert(session)
        .values({ ...sessionInput })
        .returning()
    )[0];
    if (!databaseSession) throw new Error("Couldn't create session");
    return databaseSession;
  },
  deleteSession: async (sessionId) => {
    await db.delete(session).where(eq(session.id, sessionId));
  },
  deleteSessionsByUserId: async (userId, sessionsToKeep) => {
    await db
      .delete(session)
      .where(
        and(eq(session.userId, userId), notInArray(session.id, sessionsToKeep)),
      );
  },
  setKey: async (key) => {
    const databaseKey = (
      await db
        .insert(authKey)
        .values({ ...key })
        .returning()
    )[0];
    if (!databaseKey) throw new Error("Couldn't create key");
    return databaseKey;
  },
  deleteKey: async (providerId, providerUserId) => {
    await db
      .delete(authKey)
      .where(
        and(
          eq(authKey.provider, providerId),
          eq(authKey.providerUserId, providerUserId),
        ),
      );
  },
  getKeysByUserId: async (userId) => {
    const databaseKeys = await db.query.authKey.findMany({
      where: eq(authKey.userId, userId),
    });
    return databaseKeys;
  },
  updateKey: async (providerId, providerUserId, partialKey) => {
    const databaseKey = await db
      .update(authKey)
      .set(partialKey)
      .where(
        and(
          eq(authKey.provider, providerId),
          eq(authKey.providerUserId, providerUserId),
        ),
      )
      .returning();
    if (!databaseKey[0]) throw new Error("Couldn't update key");
    return databaseKey[0];
  },
};
