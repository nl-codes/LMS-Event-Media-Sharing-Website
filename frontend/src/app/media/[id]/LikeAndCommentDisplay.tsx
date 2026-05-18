import { Heart, MessageCircle } from "lucide-react";
import { InteractionModalTab } from "@/components/media/InteractionModal";

interface LikeAndCommentDisplayProps {
    isLiked: boolean;
    likesCount: number;
    isLikeAnimating: boolean;
    commentsCount: number;
    onToggleLike: () => void;
    onOpenModal: (tab: InteractionModalTab) => void;
}

export default function LikeAndCommentDisplay({
    isLiked,
    likesCount,
    isLikeAnimating,
    commentsCount,
    onToggleLike,
    onOpenModal,
}: LikeAndCommentDisplayProps) {
    return (
        <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/60 p-1.5 shadow-sm ring-1 ring-cusblue/5 backdrop-blur-md sm:w-fit">
            <div className="flex items-center rounded-xl bg-white/40 px-1 py-0.5">
                <button
                    type="button"
                    onClick={onToggleLike}
                    className="group rounded-lg p-2 transition-colors hover:bg-white disabled:cursor-not-allowed"
                    aria-label={isLiked ? "Unlike media" : "Like media"}>
                    <Heart
                        className={`h-5 w-5 transition duration-300 ${
                            isLikeAnimating
                                ? "scale-125"
                                : "group-hover:scale-110"
                        }`}
                        color={isLiked ? "#f43f5e" : "#64748b"}
                        fill={isLiked ? "#f43f5e" : "none"}
                    />
                </button>

                <button
                    type="button"
                    onClick={() => onOpenModal("likes")}
                    className="px-2 py-2 text-sm font-black text-cusblue hover:cursor-pointer">
                    {likesCount}
                    <span className="ml-1">Likes</span>
                </button>
            </div>

            <button
                type="button"
                onClick={() => onOpenModal("comments")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-cusblue transition hover:bg-white/80 hover:cursor-pointer">
                <MessageCircle className="h-5 w-5 text-slate-500" />
                <span>{commentsCount}</span>
                <span>Comments</span>
            </button>
        </div>
    );
}
