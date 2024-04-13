import * as argon2 from "argon2";

export const hashA2 = (s: string): Promise<string> => {
  return argon2.hash(s);
};

export const validateA2Hash = (s: string, hash: string): Promise<boolean> => {
  return argon2.verify(hash, s);
};

export const generateRandomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min) + min);
};
