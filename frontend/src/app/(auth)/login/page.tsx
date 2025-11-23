import LoginForm from "./login-form";
import Image from "next/image";
import SignupNewButton from "./SignupNewButton";

export default function Home() {
    return (
        <div className="mt-40 flex justify-around">
            <Image
                src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763879563/lms_landing_b7oxfx.png"
                width="360"
                height="360"
                alt="Global Connection"
            />
            <div className="flex flex-col w-[360px] gap-5">
                <p className="font-extrabold text-4xl">Login</p>
                <p className="font-medium text-xl">
                    Where your memories come together — step back in and join
                    your story.
                </p>
                <SignupNewButton />
            </div>
            <div className="flex items-center">
                <LoginForm />
            </div>
        </div>
    );
}
