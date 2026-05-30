import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes accessible without authentication
const PUBLIC_PATHS = [
    "/",
    "/login",
    "/signup",
    "/admin/login",
    "/admin/signup",
    "/forgot-password",
    "/reset-password",
    "/signup/activate",
    "/signup/reactivate",
    "/events",
    "/pricing",
    "/media",
    "/request",
    "/explore",
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

function dashboardForRole(role: unknown) {
    if (role === "superadmin") return "/superadmin/home";
    if (role === "admin") return "/admin/home";
    return "/home";
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

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;
    const payload = token ? await verifyToken(token) : null;

    if (pathname.startsWith("/super-admin")) {
        return NextResponse.redirect(
            new URL(
                pathname.replace("/super-admin", "/superadmin"),
                request.url,
            ),
        );
    }

    if (
        payload &&
        (pathname === "/admin/login" || pathname === "/admin/signup")
    ) {
        return NextResponse.redirect(
            new URL(dashboardForRole(payload.role), request.url),
        );
    }

    // Authenticated user trying to access auth pages -> redirect to dashboard
    if (payload && isAuthPage(pathname)) {
        return NextResponse.redirect(
            new URL(dashboardForRole(payload.role), request.url),
        );
    }

    // Public routes - allow access
    if (isPublic(pathname)) {
        return NextResponse.next();
    }

    // No valid token -> redirect to login
    if (!payload) {
        return NextResponse.redirect(
            new URL(
                pathname.startsWith("/admin") ||
                    pathname.startsWith("/superadmin")
                    ? "/admin/login"
                    : "/login",
                request.url,
            ),
        );
    }

    // Role-based authorization
    const isOthersProfileRoute =
        /^\/home\/profile\/[^/]+\/others(?:\/.*)?$/.test(pathname);
    if (
        pathname.startsWith("/home") &&
        payload.role !== "user" &&
        !(
            isOthersProfileRoute &&
            (payload.role === "admin" || payload.role === "superadmin")
        )
    ) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/admin") && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/superadmin") && payload.role !== "superadmin") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
