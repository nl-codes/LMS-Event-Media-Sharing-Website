import Image from "next/image";
import HomeButtonsGroup from "./HomeButtonsGroup";

export default function Home() {
    return (
        <div className="flex mt-12 justify-around">
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
                src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763879563/lms_landing_b7oxfx.png"
                width="700"
                height="500"
                alt="Global Connection"
            />
        </div>
    );
}
