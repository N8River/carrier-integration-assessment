import type { RateRequest, RateQuote } from "../../types/index";
import type { UpsRateRequestBody, UpsRatedShipment, UpsAddress } from "./types";
import { CarrierError } from "../../errors/index";

function toUpsAddress(addr: RateRequest["origin"]): UpsAddress {
  return {
    AddressLine: [addr.street],
    City: addr.city,
    StateProvinceCode: addr.stateCode,
    PostalCode: addr.postalCode,
    CountryCode: addr.countryCode,
  };
}

export function toUpsRateRequest(req: RateRequest): UpsRateRequestBody {
  const pkg = req.packages[0];

  return {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: "carrier-integration-service",
        },
      },
      Shipment: {
        Shipper: {
          Name: "Shipper",
          ShipperNumber: "",
          Address: toUpsAddress(req.origin),
        },
        ShipTo: {
          Name: "Recipient",
          Address: toUpsAddress(req.destination),
        },
        ShipFrom: {
          Name: "Sender",
          Address: toUpsAddress(req.origin),
        },
        PaymentDetails: {
          ShipmentCharge: [{ Type: "01", BillShipper: { AccountNumber: "" } }],
        },
        ...(req.serviceCode && {
          Service: { Code: req.serviceCode, Description: "" },
        }),
        NumOfPieces: String(req.packages.length),
        Package: {
          PackagingType: { Code: "02", Description: "Package" },
          Dimensions: {
            UnitOfMeasurement: { Code: "IN", Description: "Inches" },
            Length: String(pkg.lengthIn),
            Width: String(pkg.widthIn),
            Height: String(pkg.heightIn),
          },
          PackageWeight: {
            UnitOfMeasurement: { Code: "LBS", Description: "Pounds" },
            Weight: String(pkg.weightLb),
          },
        },
      },
    },
  };
}

export function fromUpsRatedShipment(shipment: UpsRatedShipment): RateQuote {
  const totalCharge = parseFloat(shipment.TotalCharges.MonetaryValue);

  if (isNaN(totalCharge)) {
    throw new CarrierError(
      "PARSE_ERROR",
      `UPS returned unparseable charge: ${shipment.TotalCharges.MonetaryValue}`,
      "UPS",
      false,
    );
  }

  // Prefer GuaranteedDelivery, fallback to TimeInTransit
  const businessDays =
    shipment.GuaranteedDelivery?.BusinessDaysInTransit ??
    shipment.TimeInTransit?.ServiceSummary?.EstimatedArrival
      ?.BusinessDaysInTransit;

  return {
    carrier: "UPS",
    serviceCode: shipment.Service.Code,
    serviceName: shipment.Service.Description,
    totalChargeUSD: totalCharge,
    currency: shipment.TotalCharges.CurrencyCode,
    ...(businessDays && { estimatedDays: parseInt(businessDays, 10) }),
  };
}

export function fromUpsRateResponse(raw: unknown): RateQuote[] {
  const data = raw as {
    RateResponse?: { RatedShipment?: UpsRatedShipment[] };
  };

  const shipments = data?.RateResponse?.RatedShipment;

  if (!Array.isArray(shipments) || shipments.length === 0) {
    throw new CarrierError(
      "PARSE_ERROR",
      "UPS response contained no rated shipments",
      "UPS",
      false,
    );
  }

  return shipments.map(fromUpsRatedShipment);
}
