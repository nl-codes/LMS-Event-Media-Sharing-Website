"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/eventApi";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Button from "@/components/buttons/Button";
import {
    Calendar,
    MapPin,
    Type,
    AlignLeft,
    Image as ImageIcon,
    Sparkles,
    Clock,
    Plus,
} from "lucide-react";

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    useEffect(() => {
        if (form.startTime) {
            if (form.endTime && form.endTime < form.startTime) {
                setForm((prev) => ({ ...prev, endTime: form.startTime }));
            }
        }
    }, [form.startTime, form.endTime]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

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
        <main className="min-h-screen py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <BackButton label="Back to My Events" />
                </div>
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-cusblue/5 overflow-hidden profile-card-animate">
                    {/* Header Banner */}
                    <div className="bg-cusblue h-28 flex items-center justify-center relative">
                        <Sparkles className="absolute top-4 right-6 text-white/20 w-12 h-12" />
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white tracking-tight">
                                New Event
                            </h2>
                            <p className="text-white/70 text-sm font-medium">
                                Host your next big moment
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
                                    {thumbnailPreview ? (
                                        <>
                                            <Image
                                                src={thumbnailPreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover transition duration-500 group-hover:scale-105"
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
                                                <Plus className="w-6 h-6 text-cusblue" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                Click to upload
                                                <br />
                                                event thumbnail
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
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                        <Type size={16} />
                                        Event Title
                                    </label>
                                    <input
                                        className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all"
                                        placeholder="Give your event a catchy name..."
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

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                        <AlignLeft size={16} />
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full bg-white/50 border border-slate-200 rounded-2xl px-5 py-4 h-32 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all resize-none"
                                        placeholder="What's happening at this event?"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 p-6 bg-cusblue/5 rounded-4xl border border-cusblue/10">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                            <MapPin size={16} />
                                            Location
                                        </label>
                                        <input
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all"
                                            placeholder="Venue name or Meeting link"
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* START TIME */}
                                        <div className="space-y-2 group">
                                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                                <Clock
                                                    size={16}
                                                    className="group-focus-within:text-cusblue transition-colors"
                                                />
                                                Starts
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    min={getCurrentDateTime()}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all text-sm appearance-none cursor-pointer"
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
                                        </div>

                                        {/* END TIME */}
                                        <div className="space-y-2 group">
                                            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cusblue/60 ml-1">
                                                <Clock
                                                    size={16}
                                                    className="group-focus-within:text-cusblue transition-colors"
                                                />
                                                Ends
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    min={
                                                        form.startTime ||
                                                        getCurrentDateTime()
                                                    }
                                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cusblue/20 focus:border-cusblue transition-all text-sm cursor-pointer"
                                                    value={form.endTime}
                                                    onChange={(e) =>
                                                        setForm({
                                                            ...form,
                                                            endTime:
                                                                e.target.value,
                                                        })
                                                    }
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        loading={submitting}
                                        className="bg-green-600 hover:bg-green-700 text-white w-full py-5 rounded-3xl text-lg font-bold shadow-xl shadow-green-600/20">
                                        <Calendar className="w-5 h-5" />
                                        {submitting
                                            ? "Publishing..."
                                            : "Publish Event"}
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
