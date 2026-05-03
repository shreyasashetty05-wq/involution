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
        const kycStatus = token.kycStatus as string;
        const path = request.nextUrl.pathname;

        // Admin Bypass: Allow access to /admin routes without KYC checks for testing purposes
        if (path.startsWith('/admin')) {
            return NextResponse.next();
        }

        // Force KYC for pending
        if (kycStatus === 'Pending' && path !== '/kyc/pending' && isProtectedRoute) {
            return NextResponse.redirect(new URL('/kyc/pending', request.url));
        }

        // Force KYC for rejected
        if (kycStatus === 'Rejected' && path !== '/kyc' && isProtectedRoute) {
            return NextResponse.redirect(new URL('/kyc', request.url));
        }

        // Force KYC for new users
        if ((isNewUser || (!kycDone && kycStatus !== 'Rejected')) && path !== '/kyc' && isProtectedRoute) {
            return NextResponse.redirect(new URL('/kyc', request.url));
        }

        // Handle Auth Pages when already logged in
        if (isAuthPage) {
            if (kycStatus === 'Approved') {
                return NextResponse.redirect(new URL(role === 'startup' ? '/startups/dashboard' : '/investors/dashboard', request.url));
            } else if (kycStatus === 'Pending') {
                return NextResponse.redirect(new URL('/kyc/pending', request.url));
            } else {
                return NextResponse.redirect(new URL('/kyc', request.url));
            }
        }

        // Prevent accessing /kyc if already pending or approved
        if (path === '/kyc') {
            if (kycStatus === 'Approved') {
                return NextResponse.redirect(new URL(role === 'startup' ? '/startups/dashboard' : '/investors/dashboard', request.url));
            }
            if (kycStatus === 'Pending') {
                return NextResponse.redirect(new URL('/kyc/pending', request.url));
            }
            return NextResponse.next();
        }

        // Prevent accessing /kyc/pending if not actually pending
        if (path === '/kyc/pending') {
            if (kycStatus === 'Approved') {
                return NextResponse.redirect(new URL(role === 'startup' ? '/startups/dashboard' : '/investors/dashboard', request.url));
            }
            if (kycStatus !== 'Pending') {
                return NextResponse.redirect(new URL('/kyc', request.url));
            }
            return NextResponse.next();
        }

        // --- Standard Auth Routing checks onwards ---
        // (Only approved users reach this for protected routes)

        if (kycStatus === 'Approved' || (!isProtectedRoute)) {
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
        } else if (isProtectedRoute && kycStatus !== 'Approved') {
            // Failsafe catch-all for any other weird state trying to hit protected routes
            return NextResponse.redirect(new URL('/kyc', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
