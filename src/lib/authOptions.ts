import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import dbConnect from "@/database/mongodb";
import KYCDocument from "@/database/models/KYCDocument";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id-needs-to-be-set",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret-needs-to-be-set",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.events"
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account, trigger, session }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            if (account && user) {
                // Fresh OAuth sign-in — read role cookie and check KYC status
                const cookieStore = await cookies();
                const roleCookie = cookieStore.get('involution_role');
                token.role = roleCookie?.value || "investor";

                try {
                    await dbConnect();
                    const kycRecord = await KYCDocument.findOne({ email: user.email }).sort({ createdAt: -1 });
                    token.kycDone = Boolean(kycRecord);
                    token.isNewUser = !kycRecord;
                    token.kycStatus = kycRecord?.status || 'None';
                } catch (error) {
                    console.error("NextAuth KYC Check Error:", error);
                    token.kycDone = false;
                    token.isNewUser = true;
                    token.kycStatus = 'None';
                }
            } else {
                // Subsequent token refreshes — carry existing values forward
                token.kycDone = token.kycDone ?? false;
                token.isNewUser = token.isNewUser ?? false;
                token.kycStatus = token.kycStatus ?? 'None';
            }

            // Handle session updates (either from form submission or manual refresh)
            if (trigger === "update") {
                if (session && (session as Record<string, unknown>).kycDone) {
                    // Manual override from KYC submit form
                    token.kycDone = true;
                    token.isNewUser = false;
                    token.kycStatus = (session as Record<string, unknown>).kycStatus || 'Pending';
                } else {
                    // Refetch from database (e.g. when checking pending status)
                    try {
                        await dbConnect();
                        // Use token.email because user object is not present on updates
                        const kycRecord = await KYCDocument.findOne({ email: token.email }).sort({ createdAt: -1 });
                        if (kycRecord) {
                            token.kycDone = true;
                            token.isNewUser = false;
                            token.kycStatus = kycRecord.status;
                        }
                    } catch (error) {
                        console.error("NextAuth update fetch error:", error);
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as Record<string, unknown>).role = token.role;
                (session.user as Record<string, unknown>).kycDone = token.kycDone;
                (session.user as Record<string, unknown>).isNewUser = token.isNewUser;
                (session.user as Record<string, unknown>).kycStatus = token.kycStatus;
                (session.user as Record<string, unknown>).id = token.sub;
                (session.user as Record<string, unknown>).accessToken = token.accessToken;
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
