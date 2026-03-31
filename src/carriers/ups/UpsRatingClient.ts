import axios from "axios";
import { config } from "../../config/index";
import { CarrierError } from "../../errors/index";
import type { UpsRateRequestBody, UpsErrorResponse } from "./types";

export class UpsRatingClient {
  async fetchRates(
    accessToken: string,
    body: UpsRateRequestBody,
  ): Promise<unknown> {
    try {
      const response = await axios.post(
        `${config.ups.baseUrl}/api/rating/v2409/Rate`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            transactionSrc: "carrier-integration-service",
          },
          timeout: 10_000,
        },
      );
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          throw new CarrierError(
            "NETWORK_ERROR",
            "UPS rating request timed out or failed to connect",
            "UPS",
            true,
            err,
          );
        }

        const status = err.response.status;
        const body = err.response.data as UpsErrorResponse;
        const firstError = body?.response?.errors?.[0];
        const detail = firstError
          ? `${firstError.code}: ${firstError.message}`
          : JSON.stringify(body);

        if (status === 429) {
          throw new CarrierError(
            "RATE_LIMIT_ERROR",
            `UPS rate limit exceeded`,
            "UPS",
            true,
            err,
          );
        }

        if (status === 401 || status === 403) {
          throw new CarrierError(
            "AUTH_ERROR",
            `UPS auth error on rating: ${detail}`,
            "UPS",
            false,
            err,
          );
        }

        throw new CarrierError(
          "CARRIER_ERROR",
          `UPS rating failed with status ${status}: ${detail}`,
          "UPS",
          false,
          err,
        );
      }

      throw new CarrierError(
        "PARSE_ERROR",
        "UPS rating returned a malformed response",
        "UPS",
        false,
        err,
      );
    }
  }
}
