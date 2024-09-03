import { Prisma } from "@prisma/client";
import { db } from "../utils/database";
import { auth } from "../utils/lucia";
import { hash, verify } from "@node-rs/argon2";
import { err, fromPromise, ok, ResultAsync } from "neverthrow";
import type { Session } from "lucia";
import { authRateLimiter } from "../utils/ratelimit";

interface SignupParams {
  ipAddress: string;
  email: string;
  password: string;
}

/**
 * Rate limits the number of requests from an IP address.
 * @param {string} ipAddress - The IP address to rate limit.
 */
const ratelimit = async (ipAddress: string) => {
  return ResultAsync.fromPromise(
    authRateLimiter.consume(ipAddress, 1),
    (e) => new Error(`Rate limiting failed: ${e}`)
  );
};

/**
 * Creates a new user account.
 * @param {SignupParams} params - The user's signup information.
 * @returns {ResultAsync<Session, Error>} A Result containing the created session or an error.
 */
const signup = async (
  params: SignupParams
): Promise<ResultAsync<Session, Error>> => {
  const limit = await ratelimit(params.ipAddress);
  if (limit.isErr()) return err(new Error("Too many requests"));

  const email = params.email.toLowerCase().trim();
  const passwordHash = await fromPromise(
    hash(params.password),
    (e) => new Error(`Password hashing failed: ${e}`)
  );

  if (passwordHash.isErr()) return err(passwordHash.error);
  const user = await fromPromise(
    db.user.create({
      data: {
        email,
        password: passwordHash.value,
      },
    }),
    (e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return new Error("User already exists");
        }
      }
      return new Error(`User creation failed: ${e}`);
    }
  );

  if (user.isErr()) return err(user.error);
  const session = await fromPromise(
    auth.createSession(user.value.id, {}),
    (e) => new Error(`Session creation failed: ${e}`)
  );

  if (session.isErr()) return err(session.error);
  return ok(session.value);
};

interface SigninParams {
  ipAddress: string;
  email: string;
  password: string;
}

/**
 * Authenticates a user and creates a new session.
 * @param {SigninParams} params - The user's signin credentials.
 * @returns {ResultAsync<Session, Error>} A Result containing the created session or an error.
 */
const signin = async (
  params: SigninParams
): Promise<ResultAsync<Session, Error>> => {
  const limit = await ratelimit(params.ipAddress);
  if (limit.isErr()) return err(new Error("Too many requests"));

  const email = params.email.toLowerCase().trim();
  const user = await fromPromise(
    db.user.findUnique({
      where: { email },
    }),
    (e) => new Error(`Something went wrong: ${e}`)
  );

  if (user.isErr()) return err(user.error);
  if (!user.value) return err(new Error("User not found"));

  const isValid = await fromPromise(
    verify(user.value.password, params.password),
    (e) => new Error(`Password verification failed: ${e}`)
  );

  if (isValid.isErr()) return err(isValid.error);
  if (!isValid.value) return err(new Error("Invalid password"));

  const session = await fromPromise(
    auth.createSession(user.value.id, {}),
    (e) => new Error(`Session creation failed: ${e}`)
  );

  if (session.isErr()) return err(session.error);
  return ok(session.value);
};

interface LogoutParams {
  session: string;
}

/**
 * Invalidates a user's session, effectively logging them out.
 * @param {LogoutParams} params - The session to invalidate.
 * @returns {ResultAsync<void, Error>} A Result indicating success or an error.
 */
const logout = (params: LogoutParams): ResultAsync<void, Error> => {
  return ResultAsync.fromPromise(
    auth.invalidateSession(params.session),
    (e) => new Error(`Session invalidation failed: ${e}`)
  );
};

export interface ValidateSessionResult {
  user: Prisma.UserGetPayload<{ select: { id: true; email: true } }>;
  session: Session;
}

/**
 * Validates a session and returns the user and session details.
 * @param {string} session - The session ID to validate.
 * @returns {ResultAsync<ValidateSessionResult, Error>} A Result containing the user and session details or an error.
 */
const validateSession = async (
  session: string
): Promise<ResultAsync<ValidateSessionResult, Error>> => {
  const validate = await fromPromise(
    auth.validateSession(session),
    (e) => new Error(`Session validation failed: ${e}`)
  );

  if (validate.isErr()) return err(validate.error);
  if (!validate.value.user) return err(new Error("Session not found"));

  const user = await fromPromise(
    db.user.findUnique({
      where: { id: validate.value.user.id },
      select: { id: true, email: true },
    }),
    (e) => new Error(`User not found: ${e}`)
  );

  if (user.isErr()) return err(user.error);
  if (!user.value) return err(new Error("User not found"));

  return ok({ user: user.value, session: validate.value.session });
};

export const AuthController = {
  signup,
  signin,
  logout,
  validateSession,
};
