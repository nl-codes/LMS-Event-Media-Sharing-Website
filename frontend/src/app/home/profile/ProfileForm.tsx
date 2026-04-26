"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import default_profile from "public/profile-male.png";
import { Profile } from "@/types/Profile";
import { Camera } from "lucide-react";

export type ProfileFormData = {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string | File | null;
};

type ProfileFormProps = {
    initialData: Profile | ProfileFormData | null;
    onChange?: (field: keyof ProfileFormData, value: string | File) => void;
};

export default function ProfileForm({
    initialData,
    onChange,
}: ProfileFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string>("");

    const inputClasses =
        "w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-cusblue focus:bg-white focus:ring-4 focus:ring-cusblue/10 transition-all duration-200 outline-none text-gray-700 font-medium";
    const labelClasses =
        "block text-xs font-bold uppercase tracking-widest text-cusblue/60 mb-2 ml-1";

    // Handle Cleanup of Object URLs
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onChange) {
            onChange("profilePicture", file);

            // Handle Preview Logic
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
        }
    };

    const getImageSrc = () => {
        if (preview) return preview;

        if (
            typeof initialData?.profilePicture === "string" &&
            initialData.profilePicture !== ""
        ) {
            return initialData.profilePicture;
        }
        return default_profile;
    };

    return (
        <div className="space-y-8">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4">
                <label className={labelClasses}>Profile Picture</label>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={
                        "group relative w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl transition-all duration-300 cursor-pointer hover:border-cusblue/30 active:scale-95"
                    }>
                    <Image
                        src={getImageSrc()}
                        alt="Profile"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority
                    />

                    {/* Hover Overlay - Only if editable */}

                    <div className="absolute inset-0 bg-cusblue/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white p-3 rounded-2xl shadow-xl mb-2">
                            <Camera className="text-cusblue" size={24} />
                        </div>
                        <span className="text-[11px] text-white font-black uppercase tracking-tighter">
                            {initialData?.profilePicture
                                ? "Change Photo"
                                : "Upload Photo"}
                        </span>
                    </div>
                </div>

                <>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Recommended: Square (1:1) Aspect Ratio
                    </p>
                </>
            </div>

            <div className="space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={labelClasses}>First Name</label>
                        <input
                            type="text"
                            placeholder="John"
                            value={initialData?.firstName || ""}
                            onChange={(e) =>
                                onChange?.("firstName", e.target.value)
                            }
                            className={inputClasses}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={labelClasses}>Last Name</label>
                        <input
                            type="text"
                            placeholder="Doe"
                            value={initialData?.lastName || ""}
                            onChange={(e) =>
                                onChange?.("lastName", e.target.value)
                            }
                            className={inputClasses}
                        />
                    </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-1">
                    <label className={labelClasses}>Personal Bio</label>
                    <textarea
                        placeholder="Share a bit about yourself, your interests, or what you're looking for..."
                        value={initialData?.bio || ""}
                        onChange={(e) => onChange?.("bio", e.target.value)}
                        className={`${inputClasses} h-36 resize-none leading-relaxed`}
                    />
                </div>
            </div>
        </div>
    );
}
