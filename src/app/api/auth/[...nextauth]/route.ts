import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import dbConnect from "@/database/mongodb";
import KYCDocument from "@/database/models/KYCDocument";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id-needs-to-be-set",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret-needs-to-be-set",
        })
    ],
    callbacks: {
        async jwt({ token, user, account, trigger, session }: any) {
            if (account && user) {
                // Fresh OAuth sign-in — read role cookie and check KYC status
                const cookieStore = await cookies();
                const roleCookie = cookieStore.get('involution_role');
                token.role = roleCookie?.value || "investor";

                try {
                    await dbConnect();
                    const kycRecord = await KYCDocument.findOne({ email: user.email });
                    token.kycDone = !!kycRecord;
                    // isNewUser is true only when this is a brand-new sign-in with no KYC on file
                    token.isNewUser = !kycRecord;
                } catch (error) {
                    console.error("NextAuth KYC Check Error:", error);
                    token.kycDone = false;
                    token.isNewUser = true;
                }
            } else {
                // Subsequent token refreshes — carry existing values forward
                token.kycDone = token.kycDone ?? false;
                token.isNewUser = token.isNewUser ?? false;
            }

            // Hydrate the JWT immediately after KYC form submission
            if (trigger === "update" && session?.kycDone) {
                token.kycDone = true;
                token.isNewUser = false;
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).kycDone = token.kycDone;
                (session.user as any).isNewUser = token.isNewUser;
                // Expose user ID just in case
                (session.user as any).id = token.sub;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt" as const,
    },
    secret: process.env.NEXTAUTH_SECRET || "inVolution_mock_secret_key_12345",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
