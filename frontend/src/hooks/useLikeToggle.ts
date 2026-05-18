"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { toggleLike } from "@/lib/mediaApi";

type Options = {
    /** Whether the current user can like: falsy disables the toggle and toasts an error. */
    canLike?: boolean;
    /** Run alongside the optimistic state update (e.g. mutate parent media.likedBy). */
    onOptimisticUpdate?: (nextLiked: boolean, nextCount: number) => void;
    /** Run alongside the rollback when the server call fails. */
    onRollback?: (previousLiked: boolean, previousCount: number) => void;
    /** Side effect after a successful server toggle (e.g. sync parent media object). */
    onSuccess?: (result: { liked: boolean; likesCount: number }) => void;
};

/**
 * Owns the optimistic like/unlike state for a single media item.
 * Use `onOptimisticUpdate` and `onRollback` to keep aggregate state in sync.
 */
export function useLikeToggle(
    mediaId: string,
    initialLiked: boolean,
    initialCount: number,
    options: Options = {},
) {
    const {
        canLike = true,
        onOptimisticUpdate,
        onRollback,
        onSuccess,
    } = options;
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(initialCount);

    const toggle = async () => {
        if (!canLike) {
            toast.error("Sign in to like");
            return;
        }

        const previousLiked = isLiked;
        const previousCount = likesCount;
        const nextLiked = !previousLiked;
        const nextCount = nextLiked
            ? previousCount + 1
            : Math.max(0, previousCount - 1);

        setIsLiked(nextLiked);
        setLikesCount(nextCount);
        onOptimisticUpdate?.(nextLiked, nextCount);

        try {
            const result = await toggleLike(mediaId);
            setIsLiked(result.liked);
            setLikesCount(result.likesCount);
            onSuccess?.(result);
        } catch (error) {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
            onRollback?.(previousLiked, previousCount);
            toast.error(error instanceof Error ? error.message : "Like failed");
        }
    };

    return {
        isLiked,
        likesCount,
        toggle,
        setIsLiked,
        setLikesCount,
    };
}
