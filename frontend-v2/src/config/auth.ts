export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

export const googleOAuthEnabled =
  !!googleClientId &&
  googleClientId !== "your_google_client_id";
