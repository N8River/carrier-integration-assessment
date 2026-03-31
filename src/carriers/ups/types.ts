export interface UpsAddress {
  AddressLine: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UpsRateRequestBody {
  RateRequest: {
    Request: {
      TransactionReference: { CustomerContext: string };
    };
    Shipment: {
      Shipper: { Name: string; ShipperNumber: string; Address: UpsAddress };
      ShipTo: { Name: string; Address: UpsAddress };
      ShipFrom: { Name: string; Address: UpsAddress };
      PaymentDetails: {
        ShipmentCharge: [
          { Type: "01"; BillShipper: { AccountNumber: string } },
        ];
      };
      Service?: { Code: string; Description: string };
      NumOfPieces: string;
      Package: {
        PackagingType: { Code: string; Description: string };
        Dimensions: {
          UnitOfMeasurement: { Code: "IN"; Description: "Inches" };
          Length: string;
          Width: string;
          Height: string;
        };
        PackageWeight: {
          UnitOfMeasurement: { Code: "LBS"; Description: "Pounds" };
          Weight: string;
        };
      };
    };
  };
}

export interface UpsMonetaryValue {
  CurrencyCode: string;
  MonetaryValue: string;
}

export interface UpsRatedShipment {
  Service: { Code: string; Description: string };
  TotalCharges: UpsMonetaryValue;
  GuaranteedDelivery?: { BusinessDaysInTransit: string };
  TimeInTransit?: {
    ServiceSummary?: {
      EstimatedArrival?: {
        BusinessDaysInTransit: string;
      };
    };
  };
}

export interface UpsRateResponse {
  RateResponse: {
    Response: {
      ResponseStatus: { Code: string; Description: string };
    };
    RatedShipment: UpsRatedShipment[];
  };
}

export interface UpsErrorResponse {
  response: {
    errors: Array<{ code: string; message: string }>;
  };
}
