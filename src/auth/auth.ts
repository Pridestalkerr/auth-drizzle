import { config } from "./config";
import { adapter } from "./adapter";
import { Adapter } from "./interface";

import { hashA2, validateA2Hash } from "./utils/crypto";
import { isValidDatabaseSession } from "./utils/session";
import { isWithinExpiration } from "./utils/date";
import { generateRandomString } from "./utils/nanoid";

export class Auth {
  public passwordHash = {
    generate: hashA2,
    validate: validateA2Hash,
  };

  private sessionExpiresIn = {
    activePeriod: 1000 * 60 * 60 * 24, // 1 day
    idlePeriod: 1000 * 60 * 60 * 24 * 14, // 14 days
  };

  private async getDatabaseSessionAndUser(sessionId: Adapter.SId) {
    const instance = await adapter.getSessionAndUser(sessionId);
    if (!instance) throw new Error("Session not found");
    if (!isValidDatabaseSession(instance.session[config.colDef.session.idleExpires])) {
      throw new Error("Session expired");
    }
    if (!instance.user) throw new Error("User not found");
    return instance;
  }

  private getNewSessionExpiration(sessionExpiresIn?: {
    activePeriod?: number;
    idlePeriod?: number;
  }) {
    const activePeriodExpiresAt = new Date(
      new Date().getTime() + (sessionExpiresIn?.activePeriod ?? this.sessionExpiresIn.activePeriod),
    );
    const idlePeriodExpiresAt = new Date(
      activePeriodExpiresAt.getTime() +
        (sessionExpiresIn?.idlePeriod ?? this.sessionExpiresIn.idlePeriod),
    );
    return { activePeriodExpiresAt, idlePeriodExpiresAt };
  }

  public async getUser(userId: Adapter.UId) {
    return adapter.getUser(userId);
  }

  public async createUser({
    key,
    attributes,
    transaction,
  }: {
    key:
      | ({ password: string | null } & Omit<
          Adapter.KeyInsertSchema,
          typeof config.colDef.key.userId | typeof config.colDef.key.hashedPassword
        >)
      | null;
    attributes: Adapter.UserInsertSchema;
    transaction?: Adapter.DB;
  }) {
    const trx = transaction ?? config.db;
    if (key === null) {
      return adapter.setUser(attributes, null, trx);
    }

    const hashedPassword = key.password ? await this.passwordHash.generate(key.password) : null;
    return adapter.setUser(
      attributes,
      {
        ...key,
        hashedPassword,
      },
      trx,
    );
  }

  public async updateUserAttributes(userId: Adapter.UId, attributes: Adapter.UserInsertSchema) {
    return adapter.updateUser(userId, attributes);
  }

  public async deleteUser(userId: Adapter.UId) {
    return adapter.deleteUser(userId);
  }

  public async useKey({
    provider,
    providerUserId,
    password,
  }: {
    provider: Adapter.KProvider;
    providerUserId: Adapter.KProviderUserId;
    password: string | null;
  }) {
    const databaseKey = await adapter.getKey(provider, providerUserId);
    if (!databaseKey) throw new Error("Key not found");
    const hashedPassword = databaseKey.hashedPassword;
    if (hashedPassword) {
      if (password === null) throw new Error("Password required");
      const isValid = await this.passwordHash.validate(password, hashedPassword);
      if (!isValid) throw new Error("Invalid password");
    }
    return databaseKey;
  }

  public async getSession(sessionId: Adapter.SId) {
    return {
      ...(await this.getDatabaseSessionAndUser(sessionId)),
      fresh: false,
    };
  }

  public async getAllUserSessions(userId: Adapter.UId) {
    const sessions = await adapter.getSessionsByUserId(userId);
    return sessions
      .filter((session) => isValidDatabaseSession(session[config.colDef.session.idleExpires]))
      .map((session) => ({
        ...session,
        fresh: false,
      }));
  }

  public async validateSession(sessionId: Adapter.SId) {
    const { session, user } = await this.getDatabaseSessionAndUser(sessionId);
    const active = isWithinExpiration(session[config.colDef.session.activeExpires].getTime());
    if (active) {
      return {
        session,
        user,
        fresh: false,
      };
    }
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = this.getNewSessionExpiration();

    const databaseSession = await adapter.updateSession(session[config.colDef.session.id], {
      [config.colDef.session.activeExpires]: activePeriodExpiresAt,
      [config.colDef.session.idleExpires]: idlePeriodExpiresAt,
    });

    return {
      session: databaseSession,
      user,
      fresh: true,
    };
  }

  public async createSession({
    userId,
    attributes,
    sessionId,
  }: {
    userId: Adapter.UId;
    attributes: Omit<
      Adapter.SessionInsertSchema,
      | typeof config.colDef.session.id
      | typeof config.colDef.session.userId
      | typeof config.colDef.session.activeExpires
      | typeof config.colDef.session.idleExpires
    >;
    sessionId: Adapter.SId;
  }) {
    const { activePeriodExpiresAt, idlePeriodExpiresAt } = this.getNewSessionExpiration();
    const token = sessionId ?? generateRandomString(40);
    const databaseUser = await adapter.getUser(userId);
    if (!databaseUser) throw new Error("User not found");

    const databaseSession = await adapter.setSession({
      ...attributes,
      [config.colDef.session.id]: token,
      [config.colDef.session.userId]: userId,
      [config.colDef.session.activeExpires]: activePeriodExpiresAt,
      [config.colDef.session.idleExpires]: idlePeriodExpiresAt,
    });

    return {
      session: databaseSession,
      user: databaseUser,
      fresh: false,
    };
  }

  public async updateSessionAttributes(
    sessionId: Adapter.SId,
    attributes: Adapter.SessionUpdateSchema,
  ) {
    return adapter.updateSession(sessionId, attributes);
  }

  public async invalidateSession(sessionId: Adapter.SId) {
    return adapter.deleteSession(sessionId);
  }

  public async invalidateAllUserSessions(userId: Adapter.UId, sessionsToKeep: Adapter.SId[]) {
    return adapter.deleteSessionsByUserId(userId, sessionsToKeep);
  }

  public async deleteDeadUserSessions(userId: Adapter.UId) {
    const sessions = await adapter.getSessionsByUserId(userId);
    const deadSessions = sessions.filter(
      (session) => !isValidDatabaseSession(session[config.colDef.session.idleExpires]),
    );
    await adapter.deleteSessions(deadSessions.map((session) => session[config.colDef.session.id]));
  }

  public async createKey({
    userId,
    provider,
    providerUserId,
    password,
  }: {
    userId: Adapter.UId;
    provider: Adapter.KProvider;
    providerUserId: Adapter.KProviderUserId;
    password: string | null;
  }) {
    return adapter.setKey({
      [config.colDef.key.userId]: userId,
      [config.colDef.key.provider]: provider,
      [config.colDef.key.providerUserId]: providerUserId,
      [config.colDef.key.hashedPassword]: password
        ? await this.passwordHash.generate(password)
        : null,
    });
  }

  public async deleteKey(provider: Adapter.KProvider, providerUserId: Adapter.KProviderUserId) {
    return adapter.deleteKey(provider, providerUserId);
  }

  public async getKey(provider: Adapter.KProvider, providerUserId: Adapter.KProviderUserId) {
    return adapter.getKey(provider, providerUserId);
  }

  public async getAllUserKeys(userId: Adapter.UId) {
    return adapter.getKeysByUserId(userId);
  }

  public async updateKeyPassword(
    provider: Adapter.KProvider,
    providerUserId: Adapter.KProviderUserId,
    password: string | null,
  ) {
    return adapter.updateKey(provider, providerUserId, {
      [config.colDef.key.hashedPassword]: password
        ? await this.passwordHash.generate(password)
        : null,
    });
  }
}
