import { Lucia } from "lucia";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

const client = new PrismaClient();
const adapter = new PrismaAdapter(client.session, client.user);
export const auth = new Lucia(adapter, {});
export type Auth = typeof auth;
