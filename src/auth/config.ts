import { authKey, db, session, users } from "../exampleSchema";

export const config = {
  db: db,
  userSchema: users,
  keySchema: authKey,
  sessionSchema: session,
  colDef: {
    user: {
      id: "id",
    },
    key: {
      userId: "userId",
      provider: "provider",
      providerUserId: "providerUserId",
      hashedPassword: "hashedPassword",
    },
    session: {
      id: "id",
      userId: "userId",
      activeExpires: "activeExpires",
      idleExpires: "idleExpires",
    },
  },
} as const;
