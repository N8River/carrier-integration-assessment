import axios from "axios";
import { config } from "../../config/index";
import { CarrierError } from "../../errors/index";

interface TokenCache {
  accessToken: string;
  expiresAt: number; 
}

export class UpsAuthClient {
  private cache: TokenCache | null = null;

  async getAccessToken(): Promise<string> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.accessToken;
    }
    return this.fetchNewToken();
  }

  private async fetchNewToken(): Promise<string> {
    try {
      const credentials = Buffer.from(
        `${config.ups.clientId}:${config.ups.clientSecret}`,
      ).toString("base64");

      const response = await axios.post<{
        access_token: string;
        expires_in: string;
      }>(
        config.ups.tokenUrl,
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { access_token, expires_in } = response.data;

      // Subtract 30s buffer so we refresh before actual expiry
      this.cache = {
        accessToken: access_token,
        expiresAt: Date.now() + (parseInt(expires_in, 10) - 30) * 1000,
      };

      return this.cache.accessToken;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        throw new CarrierError(
          "AUTH_ERROR",
          `UPS auth failed: ${err.response.status} ${JSON.stringify(err.response.data)}`,
          "UPS",
          false,
          err,
        );
      }
      throw new CarrierError(
        "NETWORK_ERROR",
        "UPS auth request failed due to a network error",
        "UPS",
        true,
        err,
      );
    }
  }

  // Test helper
  _setCache(cache: TokenCache | null): void {
    this.cache = cache;
  }

  _getCache(): TokenCache | null {
    return this.cache;
  }
}
