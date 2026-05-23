import { Metadata } from "next";
import Image from "next/image";
import HomeButtonsGroup from "../components/LandingPageButtonGroup";
import Logo from "public/lms_logo.png";

export const metadata: Metadata = {
    title: "LMS 24 | Live Media Sharing",
    description:
        "Share event photos and videos instantly with LMS 24 live media galleries.",
};

export default function Home() {
    return (
        <main className="w-full min-h-[calc(100vh-6rem)] px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-16 flex items-center">
            <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-between gap-10 lg:gap-12 max-w-7xl w-full mx-auto">
                {/* Hero image */}
                <div className="w-full max-w-md sm:max-w-lg lg:max-w-[600px] shrink-0">
                    <Image
                        className="rounded-2xl w-full h-auto"
                        src={Logo}
                        width={900}
                        height={700}
                        sizes="(max-width: 1024px) 100vw, 600px"
                        alt="Logo"
                        priority
                        style={{ width: "100%", height: "auto" }}
                    />
                </div>

                {/* Text */}
                <div className="flex flex-col items-center lg:items-start justify-center gap-6 sm:gap-8 w-full max-w-md text-center lg:text-left">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                        Live Media Sharing
                    </h1>

                    <p className="text-lg sm:text-xl lg:text-2xl">
                        Now share your media to all instantly
                    </p>

                    <HomeButtonsGroup />
                </div>
            </div>
        </main>
    );
}
