import { CarrierAdapter } from "../base/CarrierAdapter";
import { UpsAuthClient } from "./UpsAuthClient";
import { UpsRatingClient } from "./UpsRatingClient";
import { toUpsRateRequest, fromUpsRateResponse } from "./mapper";
import { validateRateRequest } from "../../validation/schemas";
import type { RateRequest, RateQuote } from "../../types/index";

export class UpsCarrier extends CarrierAdapter {
  readonly carrierName = "UPS";
  private auth: UpsAuthClient;
  private ratingClient: UpsRatingClient;

  constructor() {
    super();
    this.auth = new UpsAuthClient();
    this.ratingClient = new UpsRatingClient();
  }

  async getRates(request: RateRequest): Promise<RateQuote[]> {
    const validated = validateRateRequest(request);

    const token = await this.auth.getAccessToken();

    const upsPayload = toUpsRateRequest(validated);

    const rawResponse = await this.ratingClient.fetchRates(token, upsPayload);

    return fromUpsRateResponse(rawResponse);
  }
}
