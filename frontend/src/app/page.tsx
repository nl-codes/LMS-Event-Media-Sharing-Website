import { Metadata } from "next";
import Image from "next/image";
import HomeButtonsGroup from "../components/LandingPageButtonGroup";

export const metadata: Metadata = {
    title: "LMS 24 | Live Media Sharing",
    description:
        "Share event photos and videos instantly with LMS 24 live media galleries.",
};

export default function Home() {
    return (
        <main className="w-full px-4 sm:px-8 lg:px-16 mt-8 sm:mt-16 lg:mt-24">
            <div className="flex flex-col-reverse lg:flex-row lg:items-center justify-around gap-10 lg:gap-12 max-w-7xl mx-auto">
                {/* Text + CTAs */}
                <div className="flex flex-col items-center lg:items-start justify-center gap-6 sm:gap-8 w-full max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                        Live Media Sharing
                    </h1>

                    <p className="text-lg sm:text-xl lg:text-2xl">
                        Now share your media to all instantly
                    </p>

                    <HomeButtonsGroup />
                </div>

                {/* Hero image */}
                <div className="w-full max-w-[900px] mx-auto">
                    <Image
                        className="rounded-2xl w-full h-auto"
                        src="/bg-landing.jpg"
                        width={900}
                        height={700}
                        sizes="(max-width: 1024px) 100vw, 900px"
                        alt="Global Connection"
                        priority
                        style={{ width: "100%", height: "auto" }}
                    />
                </div>
            </div>
        </main>
    );
}
