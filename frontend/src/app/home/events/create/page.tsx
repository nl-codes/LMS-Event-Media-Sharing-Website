"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/eventApi";
import LandingButton from "@/components/buttons/LandingButton";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "react-hot-toast";

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
    });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const event = await createEvent(form);
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
                {/* Event Name */}
                <div className="form-section">
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
                        className="form-input h-48 min-h-[100px] resize-none text-justify"
                        placeholder="Tell us about the event..."
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    />
                </div>
                {/* Location */}
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
                {/* Date Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="form-section">
                        <label className="label text-sm!">Start Time</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full!"
                            value={form.startTime}
                            onChange={(e) =>
                                setForm({ ...form, startTime: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-section">
                        <label className="label text-sm!">End Time</label>
                        <input
                            type="datetime-local"
                            className="form-input w-full!"
                            value={form.endTime}
                            onChange={(e) =>
                                setForm({ ...form, endTime: e.target.value })
                            }
                            required
                        />
                    </div>
                </div>
                {/* Premium Toggle
                <div className="flex items-center gap-3 px-4 py-2">
                    <input
                        type="checkbox"
                        id="isPremium"
                        className="w-5 h-5 accent-cusviolet cursor-pointer"
                        checked={form.isPremium}
                        onChange={(e) =>
                            setForm({ ...form, isPremium: e.target.checked })
                        }
                    />
                    <label
                        htmlFor="isPremium"
                        className="text-cusblue font-medium cursor-pointer">
                        This is a Premium Event
                    </label>
                </div> */}
                <div className="mt-4">
                    <LandingButton
                        type="submit"
                        loading={submitting}
                        className="w-full py-4 rounded-xl text-lg shadow-md">
                        {submitting ? "Creating..." : "Create Event"}
                    </LandingButton>
                </div>
            </form>
        </main>
    );
}
