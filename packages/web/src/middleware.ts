import { withAuth } from "next-auth/middleware";
import { ROUTES } from "@/lib/routes";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    authorized: ({ req, token }) => {
      const authPaths = [ROUTES.dashboard, ROUTES.profile, ROUTES.census, ROUTES.settings, "/admin"];
      const requiresAuth = authPaths.some((p) =>
        req.nextUrl.pathname.startsWith(p)
      );
      return requiresAuth ? !!token : true;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
