import type { APIContext } from "astro";
import { defineMiddleware } from "astro:middleware";
import type { Session } from "lucia";
import { err, errAsync, ResultAsync } from "neverthrow";
import { AuthController, type ValidateSessionResult } from "./controllers/auth";
import { auth } from "./utils/lucia";

async function setSession(context: APIContext, session: Session | null) {
  const sessionCookie = session
    ? auth.createSessionCookie(session.id)
    : auth.createBlankSessionCookie();

  context.cookies.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
}

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  context.locals.auth = {
    validate: async (): Promise<ResultAsync<ValidateSessionResult, Error>> => {
      const cookie = context.cookies.get("auth_session");
      if (!cookie) return errAsync(new Error("No session cookie found"));
      return AuthController.validateSession(cookie.value);
    },
    setSession: (session: Session | null) => setSession(context, session),
  };
  return await next();
});
