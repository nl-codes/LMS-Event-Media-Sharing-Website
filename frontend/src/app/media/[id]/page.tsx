"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/navigation/BackButton";
import ReportMenu from "@/components/report/ReportMenu";
import { useUser } from "@/context/UserContext";
import { addComment, getComments, getLikes } from "@/lib/interactionApi";
import { getMediaById, toggleLike } from "@/lib/mediaApi";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import type { Interaction } from "@/types/Interaction";
import type { Media } from "@/types/Media";
import Button from "@/components/buttons/Button";
import {
    normalizeLikedByIds,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";

type ModalTab = "comments" | "likes";

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));

export default function MediaDetailPage() {
    const params = useParams<{ id: string }>();
    const mediaId = params.id;
    const { user, isInitialized } = useUser();

    const router = useRouter();

    const [media, setMedia] = useState<Media | null>(null);
    const [comments, setComments] = useState<Interaction[]>([]);
    const [likes, setLikes] = useState<Interaction[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const [areCommentsLoading, setAreCommentsLoading] = useState(true);
    const [areLikesLoading, setAreLikesLoading] = useState(false);
    const [hasLoadedLikes, setHasLoadedLikes] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ModalTab>("comments");
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);

    const eventTitle = useMemo(() => {
        if (!media) return "Untitled event";
        return typeof media.eventId === "string"
            ? "Untitled event"
            : media.eventId.eventName;
    }, [media]);

    const uploadedBy =
        media?.uploaderId?.userName || media?.guestId?.userName || "Unknown";
    const canComment = isInitialized && user && user.role !== "guest";
    const canLike = isInitialized && user && user.role !== "guest";
    const currentUserId = user?._id || "";
    const eventId = useMemo(() => {
        if (!media) return "";
        return typeof media.eventId === "string"
            ? media.eventId
            : media.eventId._id;
    }, [media]);

    const handleNewMedia = useCallback(() => {}, []);

    const handleMediaDeleted = useCallback(
        (deletedMediaId: string) => {
            if (deletedMediaId === mediaId) {
                toast.error("This media was removed");
                router.back();
            }
        },
        [mediaId, router],
    );

    const handleMediaLiked = useCallback(
        ({
            mediaId: likedMediaId,
            likesCount,
            userId,
            liked,
        }: {
            mediaId: string;
            likesCount: number;
            userId: string;
            liked?: boolean;
        }) => {
            if (likedMediaId !== mediaId) return;

            setLikesCount(likesCount);
            setMedia((prev) => {
                if (!prev) return prev;

                const likedBy = normalizeLikedByIds(prev.likedBy);
                const nextLikedBy =
                    typeof liked === "boolean" && userId
                        ? liked
                            ? [...new Set([...likedBy, userId])]
                            : likedBy.filter((id) => id !== userId)
                        : likedBy;

                return {
                    ...prev,
                    likedBy: nextLikedBy,
                    likesCount,
                };
            });

            if (userId === currentUserId && typeof liked === "boolean") {
                setIsLiked(liked);
            }

            setHasLoadedLikes(false);
        },
        [currentUserId, mediaId],
    );

    useGallerySocket({
        eventId,
        onNewMedia: handleNewMedia,
        onMediaDeleted: handleMediaDeleted,
        onMediaLiked: handleMediaLiked,
    });

    useEffect(() => {
        const loadMedia = async () => {
            try {
                const data = normalizeMediaLikes(await getMediaById(mediaId));
                const likedBy = normalizeLikedByIds(data.likedBy);
                setMedia(data);
                setLikesCount(data.likesCount);
                setIsLiked(
                    Boolean(currentUserId && likedBy.includes(currentUserId)),
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to load media",
                );
            } finally {
                setIsMediaLoading(false);
            }
        };

        if (mediaId) loadMedia();
    }, [currentUserId, mediaId]);

    useEffect(() => {
        const loadComments = async () => {
            try {
                setAreCommentsLoading(true);
                const data = await getComments(mediaId);
                setComments(data);
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to load comments",
                );
            } finally {
                setAreCommentsLoading(false);
            }
        };

        if (mediaId) loadComments();
    }, [mediaId]);

    const loadLikes = useCallback(async () => {
        try {
            setAreLikesLoading(true);
            const data = await getLikes(mediaId);
            setLikes(data);
            setHasLoadedLikes(true);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to load likes",
            );
        } finally {
            setAreLikesLoading(false);
        }
    }, [mediaId]);

    useEffect(() => {
        if (isModalOpen && activeTab === "likes" && !hasLoadedLikes) {
            void loadLikes();
        }
    }, [activeTab, hasLoadedLikes, isModalOpen, loadLikes]);

    useEffect(() => {
        if (!isModalOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isModalOpen]);

    const openModal = (tab: ModalTab) => {
        setActiveTab(tab);
        setIsModalOpen(true);
    };

    const handleToggleLike = async () => {
        if (!canLike) {
            toast.error("Sign in to like");
            return;
        }

        const previousLiked = isLiked;
        const previousLikesCount = likesCount;
        const nextLiked = !isLiked;
        const nextLikesCount = nextLiked
            ? likesCount + 1
            : Math.max(0, likesCount - 1);

        setIsLiked(nextLiked);
        setLikesCount(nextLikesCount);
        setIsLikeAnimating(true);
        window.setTimeout(() => setIsLikeAnimating(false), 180);
        setMedia((prev) => {
            if (!prev) return prev;

            const likedBy = normalizeLikedByIds(prev.likedBy);
            const nextLikedBy = nextLiked
                ? [...new Set([...likedBy, currentUserId])]
                : likedBy.filter((id) => id !== currentUserId);

            return {
                ...prev,
                likedBy: nextLikedBy,
                likesCount: nextLikesCount,
            };
        });
        setHasLoadedLikes(false);

        try {
            const result = await toggleLike(mediaId);
            setIsLiked(result.liked);
            setLikesCount(result.likesCount);
            setMedia((prev) =>
                prev
                    ? {
                          ...prev,
                          likesCount: result.likesCount,
                      }
                    : prev,
            );
        } catch (error) {
            setIsLiked(previousLiked);
            setLikesCount(previousLikesCount);
            setMedia((prev) => {
                if (!prev) return prev;

                const likedBy = normalizeLikedByIds(prev.likedBy);
                const restoredLikedBy = previousLiked
                    ? [...new Set([...likedBy, currentUserId])]
                    : likedBy.filter((id) => id !== currentUserId);

                return {
                    ...prev,
                    likedBy: restoredLikedBy,
                    likesCount: previousLikesCount,
                };
            });
            toast.error(error instanceof Error ? error.message : "Like failed");
        }
    };

    const handlePostComment = async () => {
        const content = commentText.trim();
        if (!content) {
            toast.error("Write a comment first");
            return;
        }

        try {
            setIsPosting(true);
            const savedComment = await addComment(mediaId, content);
            setComments((prev) => [savedComment, ...prev]);
            setCommentText("");
            toast.success("Comment posted");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to post comment",
            );
        } finally {
            setIsPosting(false);
        }
    };

    if (isMediaLoading) {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 text-cusblue">
                <div className="mx-auto max-w-6xl">
                    <BackButton label="Back" />
                    <div className="mt-8 h-[70vh] animate-pulse rounded-3xl bg-white/70" />
                </div>
            </main>
        );
    }

    if (!media) {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 text-cusblue">
                <div className="mx-auto max-w-6xl">
                    <BackButton label="Back" />
                    <p className="mt-8 text-lg font-semibold">
                        Media could not be found.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-cuscream px-4 py-6 text-cusblue sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <BackButton label="Back" />

                <section className="mt-5 overflow-hidden rounded-3xl bg-white/80 shadow-xl ring-1 ring-cusblue/10">
                    <div className="flex min-h-[52vh] items-center justify-center bg-slate-950 sm:min-h-[68vh]">
                        {["photo", "image"].includes(
                            media.mediaType?.toLowerCase(),
                        ) ? (
                            <div className="relative h-[52vh] w-full sm:h-[68vh]">
                                <Image
                                    src={media.mediaUrl}
                                    alt={media.label || ""}
                                    fill
                                    priority
                                    className="object-contain"
                                    sizes="100vw"
                                />
                            </div>
                        ) : (
                            <video
                                src={media.mediaUrl}
                                className="max-h-[68vh] w-full bg-slate-950 object-contain"
                                controls
                            />
                        )}
                    </div>

                    <div className="space-y-6 p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cusviolet/80">
                                    {eventTitle}
                                </p>
                                <h1 className="text-2xl font-black text-cusblue sm:text-3xl tracking-tight">
                                    {media.label || "Event media"}
                                </h1>

                                {/* Improved Uploaded By Section */}
                                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <div className="flex items-center gap-2">
                                        {media.uploaderId ? (
                                            <Link
                                                href={`/home/profile/${media.uploaderId._id}/others`}
                                                className="transition-transform hover:scale-105 active:scale-95">
                                                <UserAvatar
                                                    src={
                                                        media.uploaderId
                                                            .profilePicture
                                                    }
                                                    name={
                                                        media.uploaderId
                                                            .userName
                                                    }
                                                    size="small"
                                                />
                                            </Link>
                                        ) : (
                                            <UserAvatar
                                                name={
                                                    media.guestId?.userName ||
                                                    "Unknown"
                                                }
                                                size="small"
                                            />
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                            <span className="text-sm font-bold text-cusblue">
                                                {uploadedBy}
                                            </span>
                                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                                            <span className="text-xs font-medium text-slate-500">
                                                {formatDate(media.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Likes and Comments Bar */}
                            <div className="flex items-center gap-1 rounded-2xl border border-white/70 bg-white/60 p-1.5 shadow-sm ring-1 ring-cusblue/5 backdrop-blur-md sm:w-fit">
                                <div className="flex items-center rounded-xl bg-white/40 px-1 py-0.5">
                                    <button
                                        type="button"
                                        onClick={handleToggleLike}
                                        className="group rounded-lg p-2 transition-colors hover:bg-white disabled:cursor-not-allowed"
                                        aria-label={
                                            isLiked
                                                ? "Unlike media"
                                                : "Like media"
                                        }>
                                        <Heart
                                            className={`h-5 w-5 transition duration-300 ${
                                                isLikeAnimating
                                                    ? "scale-125"
                                                    : "group-hover:scale-110"
                                            }`}
                                            color={
                                                isLiked ? "#f43f5e" : "#64748b"
                                            }
                                            fill={isLiked ? "#f43f5e" : "none"}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openModal("likes")}
                                        className="px-2 py-2 text-sm font-black text-cusblue hover:cursor-pointer">
                                        {likesCount}
                                        <span className="ml-1">Likes</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openModal("comments")}
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black text-cusblue transition hover:bg-white/80 hover:cursor-pointer">
                                    <MessageCircle className="h-5 w-5 text-slate-500 " />
                                    <span>{comments.length}</span>
                                    <span>Comments</span>
                                </button>
                            </div>
                        </div>

                        {/* Comment Input Area */}
                        <div className="border-t border-cusblue/5 pt-6">
                            {canComment ? (
                                <div className="group relative">
                                    <textarea
                                        value={commentText}
                                        onChange={(event) =>
                                            setCommentText(event.target.value)
                                        }
                                        rows={1} // Starts small
                                        maxLength={600}
                                        placeholder="Add a thoughtful comment..."
                                        className="min-h-[50px] w-full resize-none rounded-2xl border border-cusblue/10 bg-cuscream/20 px-5 py-4 text-sm text-slate-800 outline-none transition-all focus:min-h-[100px] focus:border-cusviolet/30 focus:bg-white focus:ring-4 focus:ring-cusviolet/5"
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handlePostComment}
                                            disabled={
                                                isPosting || !commentText.trim()
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl bg-cusblue px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-cusblue/20 transition-all hover:-translate-y-px hover:bg-cusviolet active:translate-y-0 disabled:opacity-50 disabled:shadow-none">
                                            <Send className="h-4 w-4" />
                                            {isPosting ? "Posting..." : "Post"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                    <p className="text-sm font-bold text-slate-500">
                                        Login in to like and comment.
                                    </p>
                                    <Button
                                        onClick={() => router.push("/login")}
                                        className="scale-90">
                                        Login
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
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
                                    <Heart
                                        className="h-5 w-5"
                                        fill="currentColor"
                                    />
                                )}
                                <h2 className="text-lg font-black">
                                    {activeTab === "comments"
                                        ? "Comments"
                                        : "Liked by"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full p-2 transition hover:bg-white/15"
                                aria-label="Close comments">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="border-b border-cusblue/10 bg-white/50 px-5 py-3">
                            <div className="inline-flex rounded-2xl bg-cuscream/70 p-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("comments")}
                                    className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                                        activeTab === "comments"
                                            ? "bg-white text-cusblue shadow-sm"
                                            : "text-slate-500 hover:text-cusblue"
                                    }`}>
                                    Comments ({comments.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("likes")}
                                    className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                                        activeTab === "likes"
                                            ? "bg-white text-cusblue shadow-sm"
                                            : "text-slate-500 hover:text-cusblue"
                                    }`}>
                                    Likes ({likesCount})
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
                                                comment.author?._id ===
                                                    currentUserId;
                                            return (
                                                <article
                                                    key={comment._id}
                                                    className="rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {comment.author
                                                                ?._id ? (
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
                                                                        comment
                                                                            .author
                                                                            ?.userName ||
                                                                        "Unknown"
                                                                    }
                                                                    size="small"
                                                                />
                                                            )}
                                                            {comment.author
                                                                ?._id ? (
                                                                <Link
                                                                    href={`/home/profile/${comment.author._id}/others`}
                                                                    className="text-sm font-black text-cusblue hover:underline truncate">
                                                                    {comment
                                                                        .author
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
                                                    src={
                                                        like.author
                                                            ?.profilePicture
                                                    }
                                                    name={
                                                        like.author?.userName ||
                                                        "Unknown"
                                                    }
                                                    size="small"
                                                />
                                                <p className="text-sm font-black text-cusblue">
                                                    {like.author?.userName ||
                                                        "Unknown"}
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
            )}
        </main>
    );
}
