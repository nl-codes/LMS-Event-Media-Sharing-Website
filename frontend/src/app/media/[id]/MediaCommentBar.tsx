import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/buttons/Button";

interface MediaCommentBarProps {
    canComment: boolean;
    commentText: string;
    isPosting: boolean;
    setCommentText: (text: string) => void;
    onPostComment: () => void;
}

export default function MediaCommentBar({
    canComment,
    commentText,
    isPosting,
    setCommentText,
    onPostComment,
}: MediaCommentBarProps) {
    const router = useRouter();

    return (
        <div className="border-t border-cusblue/5 pt-6">
            {canComment ? (
                <div className="group relative">
                    <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        rows={1}
                        maxLength={600}
                        placeholder="Add a thoughtful comment..."
                        className="min-h-[50px] w-full resize-none rounded-2xl border border-cusblue/10 bg-cuscream/20 px-5 py-4 text-sm text-slate-800 outline-none transition-all focus:min-h-[100px] focus:border-cusviolet/30 focus:bg-white focus:ring-4 focus:ring-cusviolet/5"
                    />
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={onPostComment}
                            disabled={isPosting || !commentText.trim()}
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
    );
}
