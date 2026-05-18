"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
import { addComment, getComments, getLikes } from "@/lib/interactionApi";
import { getMediaById } from "@/lib/mediaApi";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import { useLikeToggle } from "@/hooks/useLikeToggle";
import InteractionModal, {
    type InteractionModalTab,
} from "@/components/media/InteractionModal";
import type { Interaction } from "@/types/Interaction";
import type { Media } from "@/types/Media";
import {
    normalizeLikedByIds,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";
import MediaMetaData from "./MediaMetaData";
import LikeAndCommentDisplay from "./LikeAndCommentDisplay";
import MediaCommentBar from "./MediaCommentBar";

type ModalTab = InteractionModalTab;

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

    const { isLiked, likesCount, toggle, setIsLiked, setLikesCount } =
        useLikeToggle(mediaId, false, 0, {
            canLike: Boolean(canLike),
            onOptimisticUpdate: (nextLiked, nextCount) => {
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
                        likesCount: nextCount,
                    };
                });
                setHasLoadedLikes(false);
            },
            onRollback: (previousLiked, previousCount) => {
                setMedia((prev) => {
                    if (!prev) return prev;
                    const likedBy = normalizeLikedByIds(prev.likedBy);
                    const restoredLikedBy = previousLiked
                        ? [...new Set([...likedBy, currentUserId])]
                        : likedBy.filter((id) => id !== currentUserId);
                    return {
                        ...prev,
                        likedBy: restoredLikedBy,
                        likesCount: previousCount,
                    };
                });
            },
            onSuccess: (result) => {
                setMedia((prev) =>
                    prev ? { ...prev, likesCount: result.likesCount } : prev,
                );
            },
        });

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
        [currentUserId, mediaId, setIsLiked, setLikesCount],
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
    }, [currentUserId, mediaId, setIsLiked, setLikesCount]);

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
                            <MediaMetaData
                                eventTitle={eventTitle}
                                media={media}
                                uploadedBy={uploadedBy}
                            />

                            <LikeAndCommentDisplay
                                isLiked={isLiked}
                                likesCount={likesCount}
                                isLikeAnimating={isLikeAnimating}
                                commentsCount={comments.length}
                                onToggleLike={toggle}
                                onOpenModal={openModal}
                            />
                        </div>
                        <MediaCommentBar
                            canComment={Boolean(canComment)}
                            commentText={commentText}
                            isPosting={isPosting}
                            setCommentText={setCommentText}
                            onPostComment={handlePostComment}
                        />
                    </div>
                </section>
            </div>

            {isModalOpen && (
                <InteractionModal
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onClose={() => setIsModalOpen(false)}
                    comments={comments}
                    likes={likes}
                    likesCount={likesCount}
                    areCommentsLoading={areCommentsLoading}
                    areLikesLoading={areLikesLoading}
                    currentUserId={currentUserId}
                />
            )}
        </main>
    );
}
