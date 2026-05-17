"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
import { addComment, getComments, getLikes } from "@/lib/interactionApi";
import { getMediaById, toggleLike } from "@/lib/mediaApi";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import type { Interaction } from "@/types/Interaction";
import type { Media } from "@/types/Media";
import Button from "@/components/buttons/Button";
import { normalizeLikedByIds, normalizeMediaLikes } from "@/utils/HelperFunctions";

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
                setIsLiked(Boolean(currentUserId && likedBy.includes(currentUserId)));
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
                error instanceof Error
                    ? error.message
                    : "Failed to load likes",
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

    const openModal = (tab: ModalTab) => {
        setActiveTab(tab);
        setIsModalOpen(true);
    };

    const handleToggleLike = async () => {
        if (!canLike) {
            toast("Sign in to like");
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
            toast.error(
                error instanceof Error ? error.message : "Like failed",
            );
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

                    <div className="space-y-5 p-5 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-cusviolet">
                                    {eventTitle}
                                </p>
                                <h1 className="mt-1 text-2xl font-black text-cusblue sm:text-3xl">
                                    {media.label || "Event media"}
                                </h1>
                                <p className="mt-2 text-sm font-medium text-slate-600">
                                    Uploaded by {uploadedBy} on{" "}
                                    {formatDate(media.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/60 p-2 shadow-sm ring-1 ring-cusblue/10 backdrop-blur-md sm:w-fit">
                            <button
                                type="button"
                                onClick={handleToggleLike}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-cusblue transition hover:bg-white disabled:cursor-not-allowed"
                                aria-label={
                                    isLiked ? "Unlike media" : "Like media"
                                }>
                                <Heart
                                    className={`h-5 w-5 transition duration-200 ${
                                        isLikeAnimating
                                            ? "scale-125"
                                            : "scale-100"
                                    }`}
                                    color={isLiked ? "#f43f5e" : "currentColor"}
                                    fill={isLiked ? "#f43f5e" : "none"}
                                />
                                <span>{likesCount}</span>
                                <span>Likes</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openModal("comments")}
                                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-cusblue transition hover:bg-white"
                                aria-label="Open comments">
                                <MessageCircle className="h-5 w-5" />
                                <span>{comments.length}</span>
                                <span>Comments</span>
                            </button>
                        </div>

                        <div className="border-t border-cusblue/10 pt-5">
                            {canComment ? (
                                <div className="flex flex-col gap-3">
                                    <textarea
                                        value={commentText}
                                        onChange={(event) =>
                                            setCommentText(event.target.value)
                                        }
                                        rows={3}
                                        maxLength={600}
                                        placeholder="Add a comment..."
                                        className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handlePostComment}
                                        disabled={isPosting}
                                        className="inline-flex w-fit items-center gap-2 rounded-2xl bg-linear-to-r from-cusblue to-cusviolet px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
                                        <Send className="h-4 w-4" />
                                        {isPosting ? "Posting..." : "Post"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-medium text-slate-500">
                                        Login in to comment.
                                    </p>
                                    <Button
                                        onClick={() => router.push("/login")}>
                                        Login
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
                    <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-2xl backdrop-blur-xl">
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
                                        {comments.map((comment) => (
                                            <article
                                                key={comment._id}
                                                className="rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                                <p className="text-sm font-black text-cusblue">
                                                    {comment.author
                                                        ?.userName ||
                                                        "Unknown"}
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                                                    {comment.content}
                                                </p>
                                            </article>
                                        ))}
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
                                    {likes.map((like) => (
                                        <div
                                            key={like._id}
                                            className="flex items-center gap-3 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cusviolet/10 text-sm font-black text-cusviolet">
                                                {(
                                                    like.author?.userName ||
                                                    "U"
                                                )
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </div>
                                            <p className="text-sm font-black text-cusblue">
                                                {like.author?.userName ||
                                                    "Unknown"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
