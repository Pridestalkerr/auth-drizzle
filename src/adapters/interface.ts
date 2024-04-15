import { config } from "../config";

declare module Adapter {
  export type DB = typeof config.db;
  export type UId = (typeof config.userSchema.$inferSelect)[typeof config.colDef.user.id];
  export type UserSelectSchema = typeof config.userSchema.$inferSelect;
  export type UserInsertSchema = typeof config.userSchema.$inferInsert;

  export type KProvider = (typeof config.keySchema.$inferSelect)[typeof config.colDef.key.provider];
  export type KProviderUserId =
    (typeof config.keySchema.$inferSelect)[typeof config.colDef.key.providerUserId];
  export type KeySelectSchema = typeof config.keySchema.$inferSelect;
  export type KeyInsertSchema = typeof config.keySchema.$inferInsert;

  export type SId = (typeof config.sessionSchema.$inferSelect)[typeof config.colDef.session.id];
  export type SUserId =
    (typeof config.sessionSchema.$inferSelect)[typeof config.colDef.session.userId];
  export type SessionSelectSchema = typeof config.sessionSchema.$inferSelect;
  export type SessionInsertSchema = typeof config.sessionSchema.$inferInsert;
}

export type Adapter = {
  getUser(userId: Adapter.UId): Promise<Adapter.UserSelectSchema>;
  setUser(
    user: Adapter.UserInsertSchema,
    key: Omit<Adapter.KeyInsertSchema, typeof config.colDef.key.userId>,
    tx?: Adapter.DB,
  ): Promise<Adapter.UserSelectSchema>;
  updateUser(
    userId: Adapter.UId,
    partial: Adapter.UserInsertSchema,
  ): Promise<Adapter.UserSelectSchema>;
  deleteUser(userId: Adapter.UId): Promise<void>;

  getKey(
    provider: Adapter.KProvider,
    providerUserId: Adapter.KProviderUserId,
  ): Promise<Adapter.KeySelectSchema | null>;
  getKeysByUserId(userId: Adapter.UId): Promise<Adapter.KeySelectSchema[]>;
  setKey(key: Adapter.KeyInsertSchema): Promise<Adapter.KeySelectSchema>;
  updateKey(
    provider: Adapter.KProvider,
    providerUserId: Adapter.KProviderUserId,
    partialKey: Adapter.KeyInsertSchema,
  ): Promise<Adapter.KeySelectSchema>;
  deleteKey(provider: Adapter.KProvider, providerUserId: Adapter.KProviderUserId): Promise<void>;

  getSessionsByUserId(userId: Adapter.UId): Promise<Adapter.SessionSelectSchema[]>;
  setSession(session: Adapter.SessionInsertSchema): Promise<Adapter.SessionSelectSchema>;
  updateSession(
    sessionId: Adapter.SId,
    partialSession: Adapter.SessionInsertSchema,
  ): Promise<Adapter.SessionSelectSchema>;
  deleteSession(sessionId: Adapter.SId): Promise<void>;
  deleteSessionsByUserId(userId: Adapter.UId, sessionsToKeep: Adapter.SId[]): Promise<void>;

  getSessionAndUser(sessionId: Adapter.SId): Promise<{
    session: Adapter.SessionSelectSchema;
    user: Adapter.UserSelectSchema;
  } | null>;
};
