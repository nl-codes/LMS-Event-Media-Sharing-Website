"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import SignedHeader from "./SignedHeader";
import UnsignedHeader from "./UnsignedHeader";

// Routes that should render no header at all (e.g. cinema/fullscreen views).
// Match by prefix; suffix may include any subpath.
const NO_HEADER_PREFIXES: string[] = ["/nothing"];

function shouldHideHeader(pathname: string | null): boolean {
    if (!pathname) return false;
    return NO_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function HeaderManagerBase() {
    const { user, isInitialized } = useUser();
    const pathname = usePathname();

    if (shouldHideHeader(pathname)) return null;

    // Before the auth check resolves, render the UnsignedHeader so the layout
    // is stable and we don't flicker between two different headers.
    if (!isInitialized || !user) return <UnsignedHeader />;
    return <SignedHeader />;
}

const HeaderManager = memo(HeaderManagerBase);
export default HeaderManager;
