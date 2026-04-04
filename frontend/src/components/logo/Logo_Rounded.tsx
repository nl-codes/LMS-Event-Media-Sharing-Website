import Image from "next/image";
import lms_logo from "public/lms-logo-rounded.png";
import clsx from "clsx";

interface LogoProps {
    size?: 80 | 100 | 200;
    className?: string;
}

export default function LogoRounded({ size = 80, className }: LogoProps) {
    return (
        <Image
            src={lms_logo}
            alt="Logo of LMS"
            width={size}
            height={size}
            priority
            className={clsx(
                "border-2 border-[#474e93] cursor-pointer rounded-full",
                {
                    "object-contain": size === 80,
                    "absolute left-16 object-cover": size === 200,
                },
                className,
            )}
        />
    );
}
