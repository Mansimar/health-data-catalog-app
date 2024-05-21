import type { NextAuthOptions } from "next-auth"
import Github from 'next-auth/providers/github'
import Credentials from "next-auth/providers/credentials"

export const options: NextAuthOptions = {
    providers: [
        Github({
            clientId: process.env.GITBUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string      
        }),
        //We can remove this Jas
        Credentials({
            name: "Credentials",
            credentials: {
                username: {
                    label: "Username:",
                    type: "text",
                    placeholder: "your-cool-username"
                },
                password: {
                    label: "Password:",
                    type: "password",
                    placeholder: "your-awesome-password"
                }
            },
            async authorize(credentials) {
                // This is where you need to retrieve user data 
                // to verify with credentials
                // Docs: https://next-auth.js.org/configuration/providers/credentials
                const user = { id: "42", name: "Mansimar", password: "nextauth" }

                if (credentials?.username === user.name && credentials?.password === user.password) {
                    return user
                } else {
                    return null
                }
            }
        })
    ],
}