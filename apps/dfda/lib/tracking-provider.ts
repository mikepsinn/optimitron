/**
 * Wires @optimitron/tracking to this app's Prisma singleton. Import this
 * module (for its side effect) from every surface that calls tracking core
 * functions: the MCP server and the REST v1 routes. It lives outside
 * lib/mcp/ so REST routes do not pull in the MCP SDK.
 */
import { setTrackingPrismaProvider } from "@optimitron/tracking";

import { prisma } from "@/lib/prisma";

setTrackingPrismaProvider(async () => prisma);
