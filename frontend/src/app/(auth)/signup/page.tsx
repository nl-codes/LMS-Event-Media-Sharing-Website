import LoginExistingButton from "./LoginExistingButton";
import SignupForm from "./signup-form";
import Image from "next/image";

export default function Home() {
    return (
        <div className="mt-40 flex justify-around items-start">
            <Image
                src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763879563/lms_landing_b7oxfx.png"
                width="360"
                height="255"
                alt="Global Connection"
            />
            <div className="flex flex-col w-[360px] gap-5">
                <p className="font-extrabold text-4xl">Sign up</p>
                <p className="font-medium text-xl">
                    Ready to begin? Share, Upload and relieve your moments any
                    time.
                </p>
                <LoginExistingButton />
            </div>
            <div className="flex items-center">
                <SignupForm />
            </div>
        </div>
    );
}
