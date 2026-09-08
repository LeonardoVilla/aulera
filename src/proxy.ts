import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/estudar",
  "/sessao",
  "/editais",
  "/trilha",
  "/conta",
  "/onboarding",
  "/admin",
];

const { auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        pathname.startsWith(p),
      );
      return !isProtected || !!auth;
    },
  },
});

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
