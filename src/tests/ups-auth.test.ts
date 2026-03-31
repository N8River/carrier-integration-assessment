import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { UpsAuthClient } from "../carriers/ups/UpsAuthClient";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const mockTokenResponse = {
  data: {
    access_token: "test-access-token-abc123",
    expires_in: "14400", // 4 hours
  },
  status: 200,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpsAuthClient", () => {
  it("fetches a token on first call", async () => {
    mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

    const client = new UpsAuthClient();
    const token = await client.getAccessToken();

    expect(token).toBe("test-access-token-abc123");
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("reuses cached token on second call", async () => {
    mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);

    const client = new UpsAuthClient();
    await client.getAccessToken();
    await client.getAccessToken();

    // Should still be only 1 HTTP call
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("refreshes token when cache is expired", async () => {
    mockedAxios.post.mockResolvedValue(mockTokenResponse);

    const client = new UpsAuthClient();

    // Seeds an expired token
    client._setCache({
      accessToken: "expired-token",
      expiresAt: Date.now() - 1000,
    });

    const token = await client.getAccessToken();

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(token).toBe("test-access-token-abc123");
  });

  it("throws CarrierError with AUTH_ERROR on 401", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
    };
    mockedAxios.post.mockRejectedValueOnce(axiosError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const client = new UpsAuthClient();
    await expect(client.getAccessToken()).rejects.toMatchObject({
      code: "AUTH_ERROR",
      retryable: false,
      carrier: "UPS",
    });
  });

  it("throws CarrierError with NETWORK_ERROR on timeout", async () => {
    const networkError = { isAxiosError: true, response: undefined };
    mockedAxios.post.mockRejectedValueOnce(networkError);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const client = new UpsAuthClient();
    await expect(client.getAccessToken()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      retryable: true,
      carrier: "UPS",
    });
  });
});
