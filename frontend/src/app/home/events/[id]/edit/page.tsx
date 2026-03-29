"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Event, EventStatus } from "@/types/Event";
import { getEventById, updateEvent, updateEventStatus } from "@/lib/eventApi";
import LandingButton from "@/components/buttons/LandingButton";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "react-hot-toast";
import { Settings2, Loader2 } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { formatToLocalDatetime } from "@/utils/HelperFunctions";

export default function EditEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        eventName: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        isPremium: false,
        status: "Active" as EventStatus,
    });

    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";

    useEffect(() => {
        const run = async () => {
            try {
                const event: Event = await getEventById(eventId);
                setForm({
                    eventName: event.eventName,
                    description: event.description || "",
                    location: event.location,
                    startTime: formatToLocalDatetime(event.startTime),
                    endTime: formatToLocalDatetime(event.endTime),
                    isPremium: !!event.isPremium,
                    status: event.status,
                });
            } catch {
                toast.error("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [eventId]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading("Saving changes...");
        try {
            setSaving(true);
            await updateEvent(eventId, {
                eventName: form.eventName,
                description: form.description,
                location: form.location,
                startTime: new Date(form.startTime).toISOString(),
                endTime: new Date(form.endTime).toISOString(),
                isPremium: form.isPremium,
            });

            await updateEventStatus(eventId, form.status);
            toast.success("Event updated successfully", { id: loadingToast });
            router.replace(`/home/events/${eventId}`);
        } catch (e) {
            toast.error((e as Error).message, { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-cusblue">
                <Loader2 className="w-10 h-10 animate-spin opacity-50" />
            </div>
        );
    }
    console.log(form);
    return (
        <main className="max-w-3xl mx-auto px-6 py-10 profile-card-animate">
            <div className="mb-6 flex flex-row items-center gap-4">
                <BackButton label="Cancel and go back" />
            </div>

            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-cusblue/10 p-2 rounded-lg text-cusblue">
                        <Settings2 className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-cusblue">
                        Edit Event
                    </h1>
                </div>

                <form onSubmit={onSubmit} className="form">
                    <div className="form-section">
                        <label className="label">Event Name</label>
                        <input
                            className="form-input"
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
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-section">
                        <label className="label">Location</label>
                        <input
                            className="form-input"
                            value={form.location}
                            onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-section">
                            <label className="label text-sm!">Start Time</label>
                            <input
                                type="datetime-local"
                                className="form-input w-full!"
                                value={form.startTime}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        startTime: e.target.value,
                                    })
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
                                    setForm({
                                        ...form,
                                        endTime: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
                    <div className="form-section">
                        <label className="label">Event Status</label>
                        <div className="relative">
                            <select
                                className="form-input appearance-none w-full pr-10 cursor-pointer h-auto py-3" // Added h-auto and py-3
                                value={form.status}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: e.target.value as EventStatus,
                                    })
                                }>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cusblue pointer-events-none" />
                        </div>
                    </div>
                    {/* <div className="flex items-center gap-3 px-4 py-2">
                        <input
                            type="checkbox"
                            id="isPremium"
                            className="w-5 h-5 accent-cusviolet cursor-pointer"
                            checked={form.isPremium}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    isPremium: e.target.checked,
                                })
                            }
                        />
                        <label
                            htmlFor="isPremium"
                            className="text-cusblue font-medium cursor-pointer">
                            Premium Event Status
                        </label>
                    </div> */}
                    <div className="pt-6">
                        <LandingButton
                            type="submit"
                            loading={saving}
                            className="w-full py-4 rounded-xl text-lg shadow-md">
                            {saving ? "Saving..." : "Save Changes"}
                        </LandingButton>
                    </div>
                </form>
            </div>
        </main>
    );
}
