// https://next-auth.js.org/getting-started/introduction
// https://next-auth.js.org/providers/credentials
// https://next-auth.js.org/providers/github
// https://next-auth.js.org/providers/google
// https://next-auth.js.org/providers/facebook
// https://next-auth.js.org/providers/oauth

// Configures different authentication providers
// Currently, we have GitHub, Google, Facebook, Discord, and Credentials

import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { handleOAuthLogin } from "./authHandler";
// import { handleOAuthLogin } from "../../users/OAuthLogin/route";

export const options = {
  providers: [
    GitHubProvider({
      profile: async (profile, account) => {
        // updates the account object to include the provider and role
        // sending both account and profile to the handleOAuthLogin function is redundant, but it works like this. can be optimized later
        account.provider = "GitHub";
        profile.account = account;

        // sets the user role based on the provider
        let userRole = "Github User";

        // if the user is me, set the role to Admin
        if (profile?.email == "al@gmail.com") {
          // change this to your email to test role functionality
          userRole = "Admin";
        }
        // create or update the user and account in the database
        const user = await handleOAuthLogin(profile, account);

        // return the profile with the role
        return {
          ...profile,
          id: user.id,
          role: userRole,
        };
      },
      // sets the client id and secret from the environment variables
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),

    GoogleProvider({
      profile: async (profile, account) => {
        // updates the account object to include the provider and role
        // sending both account and profile to the handleOAuthLogin function is redundant, but it works like this. can be optimized later
        account.provider = "Google";
        account.role = "Google User";
        profile.account = account;

        // sets the user role based on the provider
        let userRole = "Google User";

        const user = await handleOAuthLogin(profile, account);

        console.log(user);
        return {
          ...profile,
          id: user.id,
          role: userRole,
        };
      },
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),

    FacebookProvider({
      profile: async (profile, account) => {
        // updates the account object to include the provider and role
        // sending both account and profile to the handleOAuthLogin function is redundant, but it works like this. can be optimized later
        account.provider = "Facebook";
        account.role = "Facebook User";
        profile.account = account;

        // sets the user role based on the provider
        let userRole = "Facebook User";

        // create or update the user and account in the database
        const user = await handleOAuthLogin(profile, account);

        // return the profile with the role
        return {
          ...profile,
          id: user.id,
          role: userRole,
        };
      },
      // sets the client id and secret from the environment variables
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),

    DiscordProvider({
      profile: async (profile, account) => {
        // updates the account object to include the provider and role
        // sending both account and profile to the handleOAuthLogin function is redundant, but it works like this. can be optimized later
        account.provider = "Discord";
        account.role = "Discord User";
        profile.account = account;

        // sets the user role based on the provider
        let userRole = "Discord User";

        // create or update the user and account in the database
        const user = await handleOAuthLogin(profile, account);

        // return the profile with the role
        return {
          ...profile,
          id: user.id,
          role: userRole,
        };
      },
      // sets the client id and secret from the environment variables
      clientId: process.env.DISCORD_ID,
      clientSecret: process.env.DISCORD_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "enter email" },
        password: { label: "Password", type: "password", placeholder: "enter password" },
      },
      authorize: async (credentials) => {
        try {
          // Hardcoded account bypass
          if (credentials.email === "al@gmail.com" && credentials.password === "123Viperrocks!") {
            return {
              id: "3",
              name: "Allen",
              email: "al@gmail.com",
              role: "Admin",
            };
          }

          // Otherwise, fetch the user from the database
          const res = await fetch(`http://localhost:8080/viperws_1_0_SNAPSHOT_war/api/users/${credentials.email}`);
          if (!res.ok) throw new Error("User fetch failed");

          const foundUser = await res.json();
          if (foundUser) {
            const match = await bcrypt.compare(credentials.password, foundUser.password);
            if (match) {
              delete foundUser.password;
              foundUser["role"] = "Unverified Email";
              return {
                id: foundUser.id,
                name: foundUser.username,
                email: foundUser.email,
              };
            }
          }
        } catch (error) {
          console.error("Credentials Error: ", error);
          return null;
        }
      },
    }),
  ],

  // ensures that the token.role property is synchronized with the user.role property and vice versa, allowing for consistent role-based access control throughout the application.
  callbacks: {
    // This callback is triggered during the sign-in process or when the JWT token is refreshed.
    async jwt({ token, user, profile, account }) {
      console.log("token", token);
      console.log("user", user);
      console.log("profile", profile);
      console.log("account", account);
      // Check if the sign-in process is ongoing by verifying if `user` is defined.
      if (user) {
        token.loginType = account.provider || "Credentials"; 
        token.userId = user.id; // Store the user's database ID in the token
        token.name = user.name; // Optionally store the user's name if needed
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user.id && token.userId) {
        session.user.id = token.userId; // Set the user ID in the session
        session.user.name = token.name; // Set the user's name in the session, if stored in the token
        session.user.loginType = token.loginType;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development" ? true : false,
};