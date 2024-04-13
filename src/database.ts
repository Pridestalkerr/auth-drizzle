export type UserSelectSchema = {
  id: string;
  firstName: string;
  lastName: string;
};

export type UserInsertSchema = {
  id?: string; // optional, in case its generated by the database
  firstName: string;
  lastName: string;
};

export type KeySelectSchema = {
  id: string;
  userId: string;
  providerId: string;
  providerUserId: string;
};

export type KeyInsertSchema = {
  id?: string;
  userId: string;
  providerId: string;
  providerUserId: string;
};

export type SessionSelectSchema = {
  id: string;
  userId: string;
  activeExpires: Date;
  idleExpires: Date;
  token: string; // can be ommited and use id instead
};

export type SessionInsertSchema = {
  id?: string;
  userId: string;
  activeExpires: Date;
  idleExpires: Date;
  token: string;
};