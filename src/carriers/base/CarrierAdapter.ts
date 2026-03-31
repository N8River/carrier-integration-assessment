import type { RateRequest, RateQuote } from "../../types/index";

export abstract class CarrierAdapter {
  abstract readonly carrierName: string;

  abstract getRates(request: RateRequest): Promise<RateQuote[]>;

  purchaseLabel(..._args: unknown[]): Promise<never> {
    throw new Error(`${this.carrierName}: purchaseLabel not implemented`);
  }

  getTracking(..._args: unknown[]): Promise<never> {
    throw new Error(`${this.carrierName}: getTracking not implemented`);
  }

  validateAddress(..._args: unknown[]): Promise<never> {
    throw new Error(`${this.carrierName}: validateAddress not implemented`);
  }
}
