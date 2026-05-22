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
        <>
            <div className="flex mt-[100] justify-around">
                <div className="flex flex-col items-center justify-center gap-8 w-[400px]">
                    <p className="text-6xl font-extrabold text-left">
                        Live Media Sharing
                    </p>

                    <p className="text-2xl text-left">
                        Now share your media to all instantly
                    </p>
                    <HomeButtonsGroup />
                </div>

                <Image
                    className="rounded-2xl"
                    src="/bg-landing.png"
                    width="900"
                    height="700"
                    alt="Global Connection"
                />
            </div>
        </>
    );
}
