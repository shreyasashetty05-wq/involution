import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from "next-auth/jwt";

/**
 * Handles request routing and access control for authenticated users, including role-based redirects and KYC gating.
 * @example
 * proxy(request)
 * NextResponse.redirect(new URL('/login', request.url))
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A NextResponse that either allows the request to continue or redirects the user.
 **/
export async function proxy(request: NextRequest) {
    // Decode the NextAuth JWT to access custom fields like 'role'
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "inVolution_mock_secret_key_12345" });
    const isAuthPage = request.nextUrl.pathname.startsWith('/login');

    const protectedRoutes = ['/messages', '/startups/publish', '/startups/dashboard', '/investors/search', '/investors/dashboard', '/kyc', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (token) {
        const role = token.role as string;
        const kycDone = token.kycDone as boolean;
        const isNewUser = token.isNewUser as boolean;
        const path = request.nextUrl.pathname;

        // Never restrict access to auth endpoints, or the active kyc submission page
        if (isAuthPage) {
            // Only redirect to KYC if this is a brand-new sign-in with no KYC record
            if (isNewUser && !kycDone) {
                return NextResponse.redirect(new URL('/kyc', request.url));
            } else {
                return NextResponse.redirect(new URL(role === 'startup' ? '/startups/dashboard' : '/investors/dashboard', request.url));
            }
        }

        if (path === '/kyc') {
            if (kycDone) {
                return NextResponse.redirect(new URL(role === 'startup' ? '/startups/dashboard' : '/investors/dashboard', request.url));
            }
            // It's not done, so allow access to '/kyc'
            return NextResponse.next();
        }

        // Force KYC only for brand-new users who haven't completed it yet
        if (isNewUser && !kycDone && isProtectedRoute) {
            return NextResponse.redirect(new URL('/kyc', request.url));
        }

        // --- Standard Auth Routing checks onwards ---

        // Prevent cross-access based on roles
        if (role === 'startup' && path.startsWith('/investors')) {
            return NextResponse.redirect(new URL('/startups/dashboard', request.url));
        }

        if (role === 'investor' && path.startsWith('/startups/dashboard')) {
            return NextResponse.redirect(new URL('/investors/dashboard', request.url));
        }

        // Prevent investors from publishing pitches
        if (role === 'investor' && path.startsWith('/startups/publish')) {
            return NextResponse.redirect(new URL('/investors/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
