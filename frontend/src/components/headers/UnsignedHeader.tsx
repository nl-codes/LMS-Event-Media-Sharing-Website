import LandingButton from "@/components/buttons/LandingButton";
import Image from "next/image";

export default function UnsignedHeader() {
    return (
        <div className="flex justify-end gap-16 py-12 pr-16 border-b-2 border-cusblue">
            <LandingButton className=""> Watch how it works </LandingButton>
            <LandingButton className=""> Pricing </LandingButton>
            <LandingButton className=""> Events </LandingButton>
            <Image
                src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763878601/lms_logo_fw6m2q.png"
                width={200}
                height={200}
                className="absolute left-16"
                alt="Logo of LMS"
            />
        </div>
    );
}
