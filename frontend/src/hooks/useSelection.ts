"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
    /**
     * Predicate gating selection activation. When provided and returns false,
     * `start()` is a no-op (used to restrict selection mode to event hosts).
     */
    canStart?: () => boolean;
};

/**
 * Generic multi-select state shared by gallery pages.
 * Tracks an "active" mode flag plus the set of selected string IDs.
 *
 * All returned handlers have stable identities across renders so consumers can
 * safely list them in useEffect/useCallback dependency arrays without looping.
 */
export function useSelection(options: Options = {}) {
    const { canStart } = options;
    const [isActive, setIsActive] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Keep the latest canStart in a ref so the stable start() closure always
    // sees the freshest predicate without needing to be re-created.
    const canStartRef = useRef(canStart);
    useEffect(() => {
        canStartRef.current = canStart;
    });

    const start = useCallback(() => {
        const guard = canStartRef.current;
        if (guard && !guard()) return;
        setIsActive(true);
    }, []);

    const clear = useCallback(() => {
        setSelectedIds([]);
        setIsActive(false);
    }, []);

    const toggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            // Honour active-mode by reading current state via the setter form
            // so we don't need isActive in the dep array.
            return prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id];
        });
    }, []);

    /** Remove an id from the selection without toggling/respecting active state. */
    const remove = useCallback((id: string) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
    }, []);

    return {
        isActive,
        selectedIds,
        selectedCount: selectedIds.length,
        start,
        clear,
        toggle,
        remove,
    };
}
