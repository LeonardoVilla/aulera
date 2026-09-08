import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const microsoftEnabled =
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  !!process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;

export const authConfig: NextAuthConfig = {
  providers: [
    Google,
    ...(microsoftEnabled
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
            // Sem "issuer" o Auth.js usa https://login.microsoftonline.com/common/v2.0/,
            // que aceita contas pessoais (Outlook/Hotmail) e de qualquer organização.
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
};

export const isMicrosoftLoginEnabled = microsoftEnabled;
