"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/eventApi";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Button from "@/components/buttons/Button";

export default function CreateEventPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        eventName: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        isPremium: false,
        thumbnail: null as File | null,
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // IMPORTANT: Use FormData for file uploads
            const formData = new FormData();
            formData.append("eventName", form.eventName);
            formData.append("description", form.description);
            formData.append("location", form.location);
            formData.append("startTime", form.startTime);
            formData.append("endTime", form.endTime);
            formData.append("isPremium", String(form.isPremium));

            if (form.thumbnail) {
                formData.append("thumbnail", form.thumbnail);
            }

            // Pass formData to your API call
            const event = await createEvent({
                eventName: form.eventName,
                description: form.description,
                location: form.location,
                startTime: new Date(form.startTime).toISOString(),
                endTime: new Date(form.endTime).toISOString(),
                isPremium: form.isPremium,
                thumbnail: form.thumbnail,
            });

            toast.success("Event created successfully!");
            router.push(`/home/events/${event._id}`);
        } catch (err) {
            toast.error((err as Error).message || "Failed to create event");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)] py-10">
            <form
                onSubmit={onSubmit}
                className="form p-8 rounded-xl shadow-xl bg-white/50 backdrop-blur-sm profile-card-animate w-full"
                style={{ width: "100%", maxWidth: "600px" }}>
                <div className="mb-4 flex flex-row items-center gap-4">
                    <BackButton label="Back to My Events" />
                </div>

                <h2 className="text-3xl font-bold text-cusblue text-center mb-2">
                    Create Event
                </h2>
                <p className="text-center text-cusviolet mb-6">
                    Fill in the details for your new event
                </p>

                {/* Thumbnail Section */}
                <div className="form-section">
                    <label className="label">Event Thumbnail</label>
                    <div className="rounded-2xl border border-cusblue/15 p-3 bg-white/70">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="form-input w-full border-none px-0 py-0 shadow-none cursor-pointer"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setForm({ ...form, thumbnail: file });

                                if (thumbnailPreview)
                                    URL.revokeObjectURL(thumbnailPreview);
                                if (file) {
                                    setThumbnailPreview(
                                        URL.createObjectURL(file),
                                    );
                                } else {
                                    setThumbnailPreview("");
                                }
                            }}
                        />

                        <div className="mt-3 rounded-2xl overflow-hidden border border-transparent bg-linear-to-r from-cusblue to-cusviolet p-px">
                            <div className="relative h-44 w-full bg-cuscream rounded-2xl overflow-hidden">
                                {thumbnailPreview ? (
                                    <Image
                                        src={thumbnailPreview}
                                        alt="Selected event thumbnail preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="h-full w-full bg-linear-to-r from-cusblue/10 to-cusviolet/10 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-cusblue/70 text-center px-4">
                                        Thumbnail Preview
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Name */}
                <div className="form-section mt-4">
                    <label className="label">Event Name</label>
                    <input
                        className="form-input w-full"
                        placeholder="e.g. Annual Tech Summit"
                        value={form.eventName}
                        onChange={(e) =>
                            setForm({ ...form, eventName: e.target.value })
                        }
                        required
                    />
                </div>

                <div className="form-section">
                    <label className="label">Description</label>
                    <textarea
                        className="form-input h-32 min-h-[100px] resize-none"
                        placeholder="Tell us about the event..."
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    />
                </div>

                <div className="form-section">
                    <label className="label">Location</label>
                    <input
                        className="form-input"
                        placeholder="Venue or Link"
                        value={form.location}
                        onChange={(e) =>
                            setForm({ ...form, location: e.target.value })
                        }
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="form-section">
                        <label className="label text-sm">Start Time</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={form.startTime}
                            onChange={(e) =>
                                setForm({ ...form, startTime: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-section">
                        <label className="label text-sm">End Time</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full"
                            value={form.endTime}
                            onChange={(e) =>
                                setForm({ ...form, endTime: e.target.value })
                            }
                            required
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        type="submit"
                        loading={submitting}
                        className="w-full py-4 rounded-xl text-lg shadow-md">
                        {submitting ? "Creating..." : "Create Event"}
                    </Button>
                </div>
            </form>
        </main>
    );
}
