export type Adapter<
  // user table
  User_IdField extends string,
  UserSelectSchema extends {
    [K in User_IdField]: unknown;
  },
  UserInsertSchema extends {
    [K in User_IdField]?: unknown;
  },
  // key table
  Key_UserIdField extends string,
  Key_ProviderIdField extends string | number,
  Key_ProviderUserIdField extends string | number, // TODO: can these be symbols?
  KeySelectSchema extends {
    [K in Key_UserIdField]: unknown;
  } & {
    [K in Key_ProviderIdField]: unknown;
  } & {
    [K in Key_ProviderUserIdField]: unknown;
  },
  KeyInsertSchema extends {
    [K in Key_UserIdField]?: unknown;
  } & {
    [K in Key_ProviderIdField]: unknown;
  } & {
    [K in Key_ProviderUserIdField]: unknown;
  },
  // session table
  Session_IdField extends string,
  SessionSelectSchema extends {
    [K in Session_IdField]: unknown;
  },
  SessionInsertSchema extends {
    [K in Session_IdField]?: unknown;
  },
  // transaction
  DB,
> = Readonly<{
  getUser: (
    userId: UserSelectSchema[User_IdField],
  ) => Promise<UserSelectSchema | null>;
  setUser: (
    user: UserInsertSchema,
    key: Omit<KeyInsertSchema, Key_UserIdField>,
    tx?: DB,
  ) => Promise<UserSelectSchema>;
  updateUser: (
    userId: UserSelectSchema[User_IdField],
    partialUser: UserInsertSchema,
  ) => Promise<UserSelectSchema>;
  deleteUser: (userId: UserSelectSchema[User_IdField]) => Promise<void>;

  getKey: (
    providerId: KeySelectSchema[Key_ProviderIdField],
    providerUserId: KeySelectSchema[Key_ProviderUserIdField],
  ) => Promise<KeySelectSchema | null>;
  getKeysByUserId: (
    userId: KeySelectSchema[Key_UserIdField],
  ) => Promise<KeySelectSchema[]>;
  setKey: (key: KeyInsertSchema) => Promise<KeySelectSchema>;
  updateKey: (
    providerId: KeySelectSchema[Key_ProviderIdField],
    providerUserId: KeySelectSchema[Key_ProviderUserIdField],
    partialKey: KeyInsertSchema,
  ) => Promise<KeySelectSchema>;
  deleteKey: (
    providerId: KeySelectSchema[Key_ProviderIdField],
    providerUserId: KeySelectSchema[Key_ProviderUserIdField],
  ) => Promise<void>;

  getSessionsByUserId: (
    userId: UserSelectSchema[User_IdField],
  ) => Promise<SessionSelectSchema[]>;
  setSession: (session: SessionInsertSchema) => Promise<SessionSelectSchema>;
  updateSession: (
    sessionId: SessionSelectSchema[Session_IdField],
    partialSession: SessionInsertSchema,
  ) => Promise<SessionSelectSchema>;
  deleteSession: (
    sessionId: SessionSelectSchema[Session_IdField],
  ) => Promise<void>;
  deleteSessionsByUserId: (
    userId: UserSelectSchema[User_IdField],
    sessionsToKeep: SessionSelectSchema[Session_IdField][],
  ) => Promise<void>;

  getSessionAndUser: (
    sessionId: SessionSelectSchema[Session_IdField],
  ) => Promise<{
    session: SessionSelectSchema;
    user: UserSelectSchema;
  } | null>;
}>;
