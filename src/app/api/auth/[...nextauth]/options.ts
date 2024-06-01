// import type { NextAuthOptions } from "next-auth"
// import Github from 'next-auth/providers/github'
// import Credentials from "next-auth/providers/credentials"

// export const options: NextAuthOptions = {
//     providers: [
//         {
//             id: "fitbit",
//             name: "Fitbit",
//             type: "oauth",
//             version: "2.0",
//             clientId: "23RM27",
//             clientSecret: "019ec52c1503676d24bc3cab7fcc4ca8",
//             // scope: "activity heartrate location nutrition oxygen_saturation profile respiratory_rate settings sleep social temperature weight",
//             // params: { grant_type: "authorization_code" },
//             accessTokenUrl: "https://api.fitbit.com/oauth2/token",
//             // authorization: "https://kauth.kakao.com/oauth/authorize",
//             authorization: "https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=23RM27&scope=activity+cardio_fitness+electrocardiogram+heartrate+location+nutrition+oxygen_saturation+profile+respiratory_rate+settings+sleep+social+temperature+weight&code_challenge=7XkkZQ27tnQbhnv2uK2tAnRPDmBcan077PpLL98_8ZA&code_challenge_method=S256&state=42354c2o702z2c0a5372290r0m4s2t6j",
//             profileUrl: "https://api.fitbit.com/1/user/-/profile.json",
//             // token: "https://kauth.kakao.com/oauth/token",
//             // userinfo: "https://kapi.kakao.com/v2/user/me",
//             profile(profile) {
//               return {
//                 id: profile.user.encodedId,
//                 name: profile.user.displayName,
//                 email: null, // Fitbit API does not provide email
//                 image: profile.user.avatar,
//               }
//             },
//           }

//         // //We can remove this Jas
//         // Credentials({
//         //     name: "Credentials",
//         //     credentials: {
//         //         username: {
//         //             label: "Username:",
//         //             type: "text",
//         //             placeholder: "your-cool-username"
//         //         },
//         //         password: {
//         //             label: "Password:",
//         //             type: "password",
//         //             placeholder: "your-awesome-password"
//         //         }
//         //     },
//         //     async authorize(credentials) {
//         //         // This is where you need to retrieve user data 
//         //         // to verify with credentials
//         //         // Docs: https://next-auth.js.org/configuration/providers/credentials
//         //         const user = { id: "42", name: "Mansimar", password: "nextauth" }

//         //         if (credentials?.username === user.name && credentials?.password === user.password) {
//         //             return user
//         //         } else {
//         //             return null
//         //         }
//         //     }
//         // })
//     ],
// }


import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

const generateCodeVerifier = () => crypto.randomBytes(32).toString("hex");
const generateCodeChallenge = (verifier: string) =>
  crypto.createHash("sha256").update(verifier).digest("base64url");

let codeVerifier = generateCodeVerifier();
let codeChallenge = generateCodeChallenge(codeVerifier);

export const options: NextAuthOptions = {
  providers: [
    {
      id: "fitbit",
      name: "Fitbit",
      type: "oauth",
      version: "2.0",
      clientId: process.env.FITBIT_CLIENT_ID,
      clientSecret: process.env.FITBIT_CLIENT_SECRET,
      authorization: {
        url: "https://www.fitbit.com/oauth2/authorize",
        params: {
          response_type: "code",
          client_id: process.env.FITBIT_CLIENT_ID,
          scope: "activity cardio_fitness electrocardiogram heartrate location nutrition oxygen_saturation profile respiratory_rate settings sleep social temperature weight",
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        },
      },
      token: {
        url: "https://api.fitbit.com/oauth2/token",
        async request(context) {
          const res = await fetch("https://api.fitbit.com/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString("base64")}`,
            },
            body: new URLSearchParams({
                client_id: process.env.FITBIT_CLIENT_ID!,
                grant_type: "authorization_code",
                redirect_uri: "http://localhost:3000/api/auth/callback/fitbit",
                code: context.params.code!,
                code_verifier: codeVerifier,
              }).toString(),
          });
          const tokens = await res.json();
          if (!res.ok) throw new Error(tokens.error_description);
          return { tokens };
        },
      },
      userinfo: "https://api.fitbit.com/1/user/-/profile.json",
      profile(profile) {
        return {
          id: profile.user.encodedId,
          name: profile.user.displayName,
          email: null,
          image: profile.user.avatar,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000; // Default to 1 hour if undefined
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.accessTokenExpires = token.accessTokenExpires;
      return session;
    },
  },
  debug: true,
};

export default (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, options);

