/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    auth: {
      validate: () => Promise<
        import("neverthrow").ResultAsync<
          import("../controllers/auth").ValidateSessionResult,
          Error
        >
      >;
      setSession: (session: import("lucia").Session | null) => void;
    };
  }
}
