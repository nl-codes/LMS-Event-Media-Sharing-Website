"use client";

import Link from "next/link";
import { Heart, MessageCircle, X } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import ReportMenu from "@/components/report/ReportMenu";
import type { Interaction } from "@/types/Interaction";

export type InteractionModalTab = "likes" | "comments";

type InteractionModalProps = {
    activeTab: InteractionModalTab;
    onTabChange: (tab: InteractionModalTab) => void;
    onClose: () => void;
    comments: Interaction[];
    likes: Interaction[];
    likesCount: number;
    areCommentsLoading: boolean;
    areLikesLoading: boolean;
    currentUserId: string;
};

export default function InteractionModal({
    activeTab,
    onTabChange,
    onClose,
    comments,
    likes,
    likesCount,
    areCommentsLoading,
    areLikesLoading,
    currentUserId,
}: InteractionModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
            onClick={onClose}
            role="presentation">
            <div
                className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-2xl backdrop-blur-xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true">
                <div className="flex items-center justify-between bg-linear-to-r from-cusblue to-cusviolet px-5 py-4 text-white">
                    <div className="flex items-center gap-2">
                        {activeTab === "comments" ? (
                            <MessageCircle className="h-5 w-5" />
                        ) : (
                            <Heart className="h-5 w-5" fill="currentColor" />
                        )}
                        <h2 className="text-lg font-black">
                            {activeTab === "comments" ? "Comments" : "Liked by"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 transition hover:bg-white/15"
                        aria-label="Close comments">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-cusblue/10 bg-white/50 px-5 py-3">
                    <div className="inline-flex rounded-2xl bg-cuscream/70 p-1">
                        <button
                            type="button"
                            onClick={() => onTabChange("likes")}
                            className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                                activeTab === "likes"
                                    ? "bg-white text-cusblue shadow-sm"
                                    : "text-slate-500 hover:text-cusblue"
                            }`}>
                            Likes ({likesCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => onTabChange("comments")}
                            className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                                activeTab === "comments"
                                    ? "bg-white text-cusblue shadow-sm"
                                    : "text-slate-500 hover:text-cusblue"
                            }`}>
                            Comments ({comments.length})
                        </button>
                    </div>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-5">
                    {activeTab === "comments" ? (
                        areCommentsLoading ? (
                            <p className="text-sm font-semibold text-slate-500">
                                Loading comments...
                            </p>
                        ) : comments.length === 0 ? (
                            <p className="text-sm font-semibold text-slate-500">
                                No comments yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => {
                                    const isOwnComment =
                                        currentUserId &&
                                        comment.author?._id === currentUserId;
                                    return (
                                        <article
                                            key={comment._id}
                                            className="rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {comment.author?._id ? (
                                                        <Link
                                                            href={`/home/profile/${comment.author._id}/others`}
                                                            className="shrink-0">
                                                            <UserAvatar
                                                                src={
                                                                    comment
                                                                        .author
                                                                        .profilePicture
                                                                }
                                                                name={
                                                                    comment
                                                                        .author
                                                                        .userName
                                                                }
                                                                size="small"
                                                            />
                                                        </Link>
                                                    ) : (
                                                        <UserAvatar
                                                            name={
                                                                comment.author
                                                                    ?.userName ||
                                                                "Unknown"
                                                            }
                                                            size="small"
                                                        />
                                                    )}
                                                    {comment.author?._id ? (
                                                        <Link
                                                            href={`/home/profile/${comment.author._id}/others`}
                                                            className="text-sm font-black text-cusblue hover:underline truncate">
                                                            {comment.author
                                                                .userName ||
                                                                "Unknown"}
                                                        </Link>
                                                    ) : (
                                                        <p className="text-sm font-black text-cusblue truncate">
                                                            Unknown
                                                        </p>
                                                    )}
                                                </div>
                                                {currentUserId &&
                                                    !isOwnComment && (
                                                        <ReportMenu
                                                            targetId={
                                                                comment._id
                                                            }
                                                            targetType="Interaction"
                                                            targetLabel="comment"
                                                            triggerClassName="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-500"
                                                        />
                                                    )}
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                                                {comment.content}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        )
                    ) : areLikesLoading ? (
                        <p className="text-sm font-semibold text-slate-500">
                            Loading likes...
                        </p>
                    ) : likes.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-500">
                            No likes yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {likes.map((like) => {
                                const inner = (
                                    <>
                                        <UserAvatar
                                            src={like.author?.profilePicture}
                                            name={
                                                like.author?.userName ||
                                                "Unknown"
                                            }
                                            size="small"
                                        />
                                        <p className="text-sm font-black text-cusblue">
                                            {like.author?.userName || "Unknown"}
                                        </p>
                                    </>
                                );
                                return like.author?._id ? (
                                    <Link
                                        key={like._id}
                                        href={`/home/profile/${like.author._id}/others`}
                                        className="flex items-center gap-3 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4 transition-colors hover:border-cusblue/30 hover:bg-cuscream/60">
                                        {inner}
                                    </Link>
                                ) : (
                                    <div
                                        key={like._id}
                                        className="flex items-center gap-3 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                        {inner}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
