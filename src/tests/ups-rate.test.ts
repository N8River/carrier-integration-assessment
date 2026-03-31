import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { UpsCarrier } from "../carriers/ups/index";
import { toUpsRateRequest } from "../carriers/ups/mapper";
import type { RateRequest } from "../types/index";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const validRequest: RateRequest = {
  origin: {
    street: "123 Main St",
    city: "Timonium",
    stateCode: "MD",
    postalCode: "21093",
    countryCode: "US",
  },
  destination: {
    street: "456 Elm St",
    city: "Alpharetta",
    stateCode: "GA",
    postalCode: "30005",
    countryCode: "US",
  },
  packages: [{ weightLb: 5, lengthIn: 10, widthIn: 8, heightIn: 6 }],
};

const mockUpsSuccessResponse = {
  data: {
    RateResponse: {
      Response: {
        ResponseStatus: { Code: "1", Description: "Success" },
      },
      RatedShipment: [
        {
          Service: { Code: "03", Description: "UPS Ground" },
          TotalCharges: { CurrencyCode: "USD", MonetaryValue: "12.85" },
          GuaranteedDelivery: { BusinessDaysInTransit: "3" },
        },
        {
          Service: { Code: "02", Description: "UPS 2nd Day Air" },
          TotalCharges: { CurrencyCode: "USD", MonetaryValue: "34.50" },
          GuaranteedDelivery: { BusinessDaysInTransit: "2" },
        },
      ],
    },
  },
  status: 200,
};

const mockTokenResponse = {
  data: { access_token: "mock-token-xyz", expires_in: "14400" },
  status: 200,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toUpsRateRequest mapper", () => {
  it("correctly maps origin address to UPS shape", () => {
    const result = toUpsRateRequest(validRequest);
    const shipper = result.RateRequest.Shipment.Shipper.Address;

    expect(shipper.AddressLine).toEqual(["123 Main St"]);
    expect(shipper.City).toBe("Timonium");
    expect(shipper.StateProvinceCode).toBe("MD");
    expect(shipper.PostalCode).toBe("21093");
    expect(shipper.CountryCode).toBe("US");
  });

  it("correctly maps package dimensions and weight to UPS shape", () => {
    const result = toUpsRateRequest(validRequest);
    const pkg = result.RateRequest.Shipment.Package;

    expect(pkg.PackageWeight.Weight).toBe("5");
    expect(pkg.PackageWeight.UnitOfMeasurement.Code).toBe("LBS");
    expect(pkg.Dimensions.Length).toBe("10");
    expect(pkg.Dimensions.UnitOfMeasurement.Code).toBe("IN");
  });

  it("omits Service field when no serviceCode provided", () => {
    const result = toUpsRateRequest(validRequest);
    expect(result.RateRequest.Shipment.Service).toBeUndefined();
  });

  it("includes Service field when serviceCode is provided", () => {
    const result = toUpsRateRequest({ ...validRequest, serviceCode: "03" });
    expect(result.RateRequest.Shipment.Service?.Code).toBe("03");
  });
});

describe("UpsCarrier.getRates", () => {
  it("returns normalized RateQuote[] on success", async () => {
    mockedAxios.post
      .mockResolvedValueOnce(mockTokenResponse) // auth
      .mockResolvedValueOnce(mockUpsSuccessResponse); // rates

    const carrier = new UpsCarrier();
    const quotes = await carrier.getRates(validRequest);

    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toMatchObject({
      carrier: "UPS",
      serviceCode: "03",
      serviceName: "UPS Ground",
      totalChargeUSD: 12.85,
      currency: "USD",
      estimatedDays: 3,
    });
  });

  it("throws CARRIER_ERROR on UPS 400", async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          response: {
            errors: [{ code: "111210", message: "Missing required field" }],
          },
        },
      },
    };
    mockedAxios.post
      .mockResolvedValueOnce(mockTokenResponse)
      .mockRejectedValueOnce(axiosError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const carrier = new UpsCarrier();
    await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
      code: "CARRIER_ERROR",
      carrier: "UPS",
    });
  });

  it("throws RATE_LIMIT_ERROR on UPS 429", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 429, data: {} },
    };
    mockedAxios.post
      .mockResolvedValueOnce(mockTokenResponse)
      .mockRejectedValueOnce(axiosError);
    mockedAxios.isAxiosError.mockReturnValue(true);

    const carrier = new UpsCarrier();
    await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
      code: "RATE_LIMIT_ERROR",
      retryable: true,
    });
  });

  it("throws NETWORK_ERROR on timeout", async () => {
    const networkError = { isAxiosError: true, response: undefined };
    mockedAxios.post
      .mockResolvedValueOnce(mockTokenResponse)
      .mockRejectedValueOnce(networkError);
    mockedAxios.isAxiosError.mockReturnValue(true);

    const carrier = new UpsCarrier();
    await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      retryable: true,
    });
  });

  it("throws PARSE_ERROR when response has no RatedShipment", async () => {
    mockedAxios.post
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce({
        data: { RateResponse: { RatedShipment: [] } },
        status: 200,
      });

    const carrier = new UpsCarrier();
    await expect(carrier.getRates(validRequest)).rejects.toMatchObject({
      code: "PARSE_ERROR",
    });
  });

  it("throws VALIDATION_ERROR before any HTTP call when request is invalid", async () => {
    const bad = { ...validRequest, packages: [] };

    const carrier = new UpsCarrier();
    await expect(carrier.getRates(bad)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    // No HTTP calls should have been made
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
