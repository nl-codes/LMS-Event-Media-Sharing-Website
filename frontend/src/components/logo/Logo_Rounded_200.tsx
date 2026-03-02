import Image from "next/image";
import lms_logo from "public/lms-logo-rounded.png";

export default function LogoRounded200() {
    return (
        <Image
            src={lms_logo}
            width={200}
            height={200}
            priority
            className="absolute left-16 border-2 border-[#474e93] cursor-pointer rounded-full object-cover"
            alt="Logo of LMS"
        />
    );
}
