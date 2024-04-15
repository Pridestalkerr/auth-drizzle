import { isWithinExpiration } from "./date";

export const isValidDatabaseSession = (expires: Date): boolean => {
  return isWithinExpiration(expires.getTime());
};
