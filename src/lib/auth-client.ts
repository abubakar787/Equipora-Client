
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const authBaseURL = process.env.NEXT_PUBLIC_API_URL;

if (!authBaseURL) {
  console.warn("NEXT_PUBLIC_API_URL is not configured.");
}

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [jwtClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
