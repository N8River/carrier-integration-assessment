# Cybership Carrier Integration Service

Built a shipping carrier integration service in TypeScript that wraps the UPS Rating API to fetch shipping rates.

## How to Run

```bash
npm install
cp .env.example .env
npm test
```

## Project Structure

```text
src/
  carriers/
    base/        # CarrierAdapter abstract class
    ups/         # UPS-specific auth,  client, mappers, types
  config/        # Env var validation
  errors/        # CarrierError class
  types/         # Internal domain models
  validation/    # Zod schemas — validates input before any network call
  tests/           # Integration and unit tests
```

## Design Decisions

- **CarrierAdapter abstract class**: Every carrier implements the same interface. Adding FedEx means creating `src/carriers/fedex/`, extending `CarrierAdapter`, and implementing `getRates`. No changes to UPS code, no changes to the base class.
- **Token caching with a 30 second buffer**: The UPS OAuth token is cached _in memory_ with its expiry time. On every request, if the token is still valid it's reused. The 30 second buffer ensures no race condition.
- **Mappers are separate from the HTTP client**: `UpsRatingClient` only does HTTP. `mapper.ts` only translates shapes. This provides separation of concerns.
- **Validation before network calls**: Zod schemas run on the input before any token is fetched or any HTTP call is made. Invalid requests fail immediately with a structured `CarrierError`.

## What I'd Improve Given More Time

- **Retry logic**: Errors with `retryable: true` (network timeouts, rate limits) should automatically retry with exponential backoff.
- **Label purchase and tracking**: Placeholders exist on `CarrierAdapter` but aren't implemented.

## Was AI Used?

Yes. I used AI to speed up the process, help solve bugs and assist with readme.
