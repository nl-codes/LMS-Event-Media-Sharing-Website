import UserAvatar from "@/components/common/UserAvatar";
import { Media } from "@/types/Media";
import { HelperFormatDateTime } from "@/utils/HelperFunctions";
import Link from "next/link";

interface MediaMetaDataProps {
    eventTitle: string;
    media: Media;
    uploadedBy: string;
}
export default function MediaMetaData({
    eventTitle,
    media,
    uploadedBy,
}: MediaMetaDataProps) {
    return (
        <div className="space-y-1">
            <p className="text-xl font-black text-cusblue tracking-tight">
                {eventTitle}
            </p>

            {/* Improved Uploaded By Section */}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-2">
                    {media.uploaderId ? (
                        <Link
                            href={`/home/profile/${media.uploaderId._id}/others`}
                            className="transition-transform hover:scale-105 active:scale-95">
                            <UserAvatar
                                src={media.uploaderId.profilePicture}
                                name={media.uploaderId.userName}
                                size="small"
                            />
                        </Link>
                    ) : (
                        <UserAvatar
                            name={media.guestId?.userName || "Unknown"}
                            size="small"
                        />
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-sm font-bold text-cusblue">
                            {uploadedBy}
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                        <span className="text-xs font-medium text-slate-500">
                            {HelperFormatDateTime(media.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
