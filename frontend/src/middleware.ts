import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes accessible without authentication
const PUBLIC_PATHS = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/signup/activate",
    "/signup/reactivate",
    "/events",
    "/pricing",
];

// Routes that authenticated users should NOT access (redirect to /home)
const AUTH_ONLY_PATHS = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/signup/activate",
    "/signup/reactivate",
];

function isPublic(path: string) {
    return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function isAuthPage(path: string) {
    return AUTH_ONLY_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyToken(token) : null;

    // Authenticated user trying to access auth pages → redirect to /home
    if (payload && isAuthPage(pathname)) {
        return NextResponse.redirect(new URL("/home", request.url));
    }

    // Public routes — allow access
    if (isPublic(pathname)) {
        return NextResponse.next();
    }

    // No valid token → redirect to login
    if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based authorization
    if (pathname.startsWith("/home") && payload.role !== "user") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
