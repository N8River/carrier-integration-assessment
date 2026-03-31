import { z } from "zod";
import { validationError } from "../errors/index.js";
import type { RateRequest } from "../types/index.js";

export const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  stateCode: z.string().length(2, "State code must be 2 characters"),
  postalCode: z.string().min(1, "Postal code is required"),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
});

export const PackageSchema = z.object({
  weightLb: z.number().positive("Weight must be positive"),
  lengthIn: z.number().positive("Length must be positive"),
  widthIn: z.number().positive("Width must be positive"),
  heightIn: z.number().positive("Height must be positive"),
});

export const RateRequestSchema = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packages: z.array(PackageSchema).min(1, "At least one package is required"),
  serviceCode: z.string().optional(),
});

export function validateRateRequest(data: unknown): RateRequest {
  const result = RateRequestSchema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw validationError(message);
  }
  return result.data;
}
