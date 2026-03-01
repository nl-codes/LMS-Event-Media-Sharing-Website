import Image from "next/image";
import lms_logo from "public/lms-logo-rounded.png";

export default function LogoRounded80() {
    return (
        <Image
            src={lms_logo}
            alt="Logo"
            width={80}
            height={80}
            className="border-2 border-[#474e93] cursor-pointer rounded-full object-contain"
        />
    );
}
