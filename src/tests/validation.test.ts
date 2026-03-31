import { describe, it, expect } from "vitest";
import { validateRateRequest } from "../validation/schemas";
import { CarrierError } from "../errors/index";

const validRequest = {
  origin: {
    street: "123 Main St",
    city: "Kansas City",
    stateCode: "MO",
    postalCode: "64101",
    countryCode: "US",
  },
  destination: {
    street: "456 Elm St",
    city: "Austin",
    stateCode: "TX",
    postalCode: "73301",
    countryCode: "US",
  },
  packages: [{ weightLb: 5, lengthIn: 10, widthIn: 8, heightIn: 6 }],
};

describe("validateRateRequest", () => {
  it("accepts a valid rate request", () => {
    const result = validateRateRequest(validRequest);
    expect(result.origin.city).toBe("Kansas City");
  });

  it("throws CarrierError when origin is missing", () => {
    const bad = { ...validRequest, origin: undefined };
    expect(() => validateRateRequest(bad)).toThrow(CarrierError);
  });

  it("throws CarrierError when weight is negative", () => {
    const bad = {
      ...validRequest,
      packages: [{ weightLb: -1, lengthIn: 10, widthIn: 8, heightIn: 6 }],
    };
    expect(() => validateRateRequest(bad)).toThrow(CarrierError);

    // Ensure the error identifies the specific field that failed
    try {
      validateRateRequest(bad);
    } catch (err: any) {
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toContain("weightLb");
    }
  });

  it("throws CarrierError when packages array is empty", () => {
    const bad = { ...validRequest, packages: [] };
    expect(() => validateRateRequest(bad)).toThrow(CarrierError);
  });

  it("throws CarrierError when stateCode is not 2 chars", () => {
    const bad = {
      ...validRequest,
      origin: { ...validRequest.origin, stateCode: "Missouri" },
    };
    expect(() => validateRateRequest(bad)).toThrow(CarrierError);
  });
});
