import clsx from "clsx";
import { Globe, Lock } from "lucide-react";

export default function EventPrivacyStatus({
    isPublic,
    showText,
    size = 25,
}: {
    isPublic: boolean;
    showText?: boolean;
    size?: number;
}) {
    return (
        <div className="flex items-center gap-2 text-xs ">
            <span
                className={clsx(
                    "flex gap-2 h-fit w-fit p-2 shrink-0 items-center justify-center rounded-2xl",
                    isPublic
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600",
                )}>
                {isPublic ? <Globe size={size} /> : <Lock size={size} />}
                {showText && (isPublic ? "Public" : "Private")}
            </span>
        </div>
    );
}
