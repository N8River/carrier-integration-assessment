import { describe, it, expect, vi } from "vitest";

describe("config", () => {
  it("throws CarrierError when a required env var is missing", async () => {
    // Clears the module cache so we can test the evaluation of the config file
    vi.resetModules();

    const original = process.env.UPS_CLIENT_ID;

    // Set to empty string instead of deleting. Deletion would allow dotenv to re-load from the .env file.
    process.env.UPS_CLIENT_ID = "";

    await expect(() => import("../config/index.js")).rejects.toThrow(
      expect.objectContaining({
        name: "CarrierError",
        code: "VALIDATION_ERROR",
        message: expect.stringContaining("UPS_CLIENT_ID"),
      }),
    );

    process.env.UPS_CLIENT_ID = original;
  });
});
