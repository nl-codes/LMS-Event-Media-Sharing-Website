"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Event, EventStatus } from "@/types/Event";
import { getEventById, updateEvent, updateEventStatus } from "@/lib/eventApi";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Button from "@/components/buttons/Button";
import { formatToLocalDatetime } from "@/utils/HelperFunctions";
import {
    MapPin,
    Type,
    AlignLeft,
    Image as ImageIcon,
    Sparkles,
    Clock,
    Loader2,
    Settings2,
    ChevronDown,
    Save,
} from "lucide-react";

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        eventName: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        isPremium: false,
        status: "Active" as EventStatus,
        thumbnail: null as File | null,
    });

    const [currentThumbnail, setCurrentThumbnail] = useState("");
    const [thumbnailPreview, setThumbnailPreview] = useState("");

    useEffect(() => {
        const fetchEvent = async () => {
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
                    thumbnail: null,
                });
                setCurrentThumbnail(event.thumbnail || "");
            } catch {
                toast.error("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        if (eventId) void fetchEvent();
    }, [eventId]);

    useEffect(() => {
        return () => {
            if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        };
    }, [thumbnailPreview]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading("Updating event...");
        try {
            setSaving(true);
            await updateEvent(eventId, {
                eventName: form.eventName,
                description: form.description,
                location: form.location,
                startTime: new Date(form.startTime).toISOString(),
                endTime: new Date(form.endTime).toISOString(),
                isPremium: form.isPremium,
                thumbnail: form.thumbnail,
            });

            await updateEventStatus(eventId, form.status);
            toast.success("Event updated successfully", { id: loadingToast });
            router.replace(`/home/events/${eventId}`);
        } catch (err) {
            toast.error((err as Error).message, { id: loadingToast });
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

    return (
        <main className="min-h-screen py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <BackButton label="Cancel and go back" />
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-cusblue/5 overflow-hidden profile-card-animate">
                    {/* Header Banner */}
                    <div className="bg-cusblue h-28 flex items-center justify-center relative">
                        <Settings2 className="absolute top-4 right-6 text-white/20 w-12 h-12" />
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                Edit Event
                            </h2>
                            <p className="text-white/70 text-sm font-medium">
                                Update the details for your event
                            </p>
                        </div>
                    </div>

                    <form onSubmit={onSubmit} className="p-8 lg:p-10">
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Thumbnail */}
                            <div className="w-full lg:w-2/5 space-y-4">
                                <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                    <ImageIcon size={16} />
                                    Cover Image
                                </label>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files?.[0] || null;
                                        setForm({ ...form, thumbnail: file });
                                        if (thumbnailPreview)
                                            URL.revokeObjectURL(
                                                thumbnailPreview,
                                            );
                                        if (file)
                                            setThumbnailPreview(
                                                URL.createObjectURL(file),
                                            );
                                    }}
                                />

                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="group relative h-64 lg:h-[420px] w-full rounded-4xl border-2 border-dashed border-cusblue/20 bg-cusblue/5 overflow-hidden cursor-pointer hover:border-cusblue/40 transition-all shadow-inner">
                                    {thumbnailPreview || currentThumbnail ? (
                                        <>
                                            <Image
                                                src={
                                                    thumbnailPreview ||
                                                    currentThumbnail
                                                }
                                                alt="Preview"
                                                fill
                                                className="object-cover transition duration-500 group-hover:scale-105"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-cusblue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white px-4 py-2 rounded-xl text-cusblue text-xs font-bold shadow-lg">
                                                    Change Photo
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-3 text-cusblue/40 px-6 text-center">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm">
                                                <ImageIcon className="w-6 h-6 text-cusblue" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                Click to upload thumbnail
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-cusviolet/50 text-center uppercase font-bold tracking-tighter">
                                    Recommended: 16:9 Aspect Ratio
                                </p>
                            </div>

                            {/* Details */}
                            <div className="w-full lg:w-3/5 space-y-6">
                                {/* Event Title */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                        <Type size={16} />
                                        Event Title
                                    </label>
                                    <input
                                        className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all"
                                        placeholder="Event name"
                                        value={form.eventName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                eventName: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                        <AlignLeft size={16} />
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 h-32 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all resize-none"
                                        placeholder="Event description"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                {/* Status & Location Container */}
                                <div className="grid grid-cols-1 gap-6 p-6 bg-cusblue/5 rounded-4xl border border-cusblue/10">
                                    {/* Status Dropdown */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                            <Sparkles size={16} />
                                            Event Status
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all appearance-none cursor-pointer"
                                                value={form.status}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        status: e.target
                                                            .value as EventStatus,
                                                    })
                                                }>
                                                <option value="Active">
                                                    Active
                                                </option>
                                                <option value="Completed">
                                                    Completed
                                                </option>
                                                <option value="Cancelled">
                                                    Cancelled
                                                </option>
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-cusblue pointer-events-none opacity-50" />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                            <MapPin size={16} />
                                            Location
                                        </label>
                                        <input
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all"
                                            placeholder="Venue or Link"
                                            value={form.location}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    location: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    {/* Timing Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 group">
                                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                                <Clock size={16} /> Starts
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all text-sm"
                                                value={form.startTime}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        startTime:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                                <Clock size={16} /> Ends
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all text-sm"
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
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        loading={saving}
                                        className="bg-cusblue hover:bg-cusblue/90 text-white w-full py-5 rounded-3xl text-lg font-bold shadow-xl shadow-cusblue/20">
                                        <Save className="w-5 h-5" />
                                        {saving
                                            ? "Saving Changes..."
                                            : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
