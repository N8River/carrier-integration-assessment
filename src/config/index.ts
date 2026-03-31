import "dotenv/config";
import { CarrierError } from "../errors/index.js";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new CarrierError(
      "VALIDATION_ERROR",
      `Missing environment variable: ${key}`,
      "system",
      false,
    );
  }
  return value;
}

export const config = {
  ups: {
    clientId: requireEnv("UPS_CLIENT_ID"),
    clientSecret: requireEnv("UPS_CLIENT_SECRET"),
    baseUrl: requireEnv("UPS_BASE_URL"),
    tokenUrl: requireEnv("UPS_TOKEN_URL"),
  },
};
