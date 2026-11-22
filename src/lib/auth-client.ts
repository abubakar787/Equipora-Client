
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const authBaseURL = process.env.NEXT_PUBLIC_API_URL;

if (!authBaseURL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

export const authClient = createAuthClient({
  baseURL: authBaseURL,

  fetchOptions: {
    credentials: "include",
  },

  plugins: [jwtClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
