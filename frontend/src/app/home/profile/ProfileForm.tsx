"use client";
import { useRef } from "react";
import Image from "next/image";
import default_profile from "public/profile-male.png";
import { Profile } from "@/types/Profile";

export type ProfileFormData = {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string | File | null;
};

type ProfileFormProps = {
    initialData: Profile | ProfileFormData | null;
    isReadOnly: boolean;
    onChange?: (field: keyof ProfileFormData, value: string | File) => void;
};

export default function ProfileForm({
    initialData,
    isReadOnly,
    onChange,
}: ProfileFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const inputClasses =
        "w-full p-2 border rounded-md bg-white text-black disabled:bg-gray-100 disabled:cursor-not-allowed";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onChange) {
            onChange("profilePicture", e.target.files[0]);
        }
    };

    const handleImageClick = () => {
        if (!isReadOnly && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const getImageSrc = () => {
        if (!initialData?.profilePicture) return default_profile;
        if (typeof initialData.profilePicture === "string") {
            return initialData.profilePicture || default_profile;
        }
        if (initialData.profilePicture instanceof File) {
            return URL.createObjectURL(initialData.profilePicture);
        }
        return default_profile;
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-col items-center gap-3">
                <div
                    onClick={handleImageClick}
                    className={`relative w-32 h-32 overflow-hidden rounded-full border-4 border-cusblue
                        ${!isReadOnly ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}>
                    <Image
                        src={getImageSrc()}
                        alt="Profile"
                        fill
                        className="object-cover"
                        priority
                    />
                    {!isReadOnly && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">
                                Change
                            </span>
                        </div>
                    )}
                </div>

                {/* 5. Hidden Input Field */}
                {!isReadOnly && (
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden" // Hide the actual input
                    />
                )}
                {!isReadOnly && (
                    <p className="text-xs text-gray-500">
                        Click image to upload
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-cusblue">
                    First Name
                </label>
                <input
                    type="text"
                    value={initialData?.firstName || ""}
                    disabled={isReadOnly}
                    onChange={(e) => onChange?.("firstName", e.target.value)}
                    className={inputClasses}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-cusblue">
                    Last Name
                </label>
                <input
                    type="text"
                    value={initialData?.lastName || ""}
                    disabled={isReadOnly}
                    onChange={(e) => onChange?.("lastName", e.target.value)}
                    className={inputClasses}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-cusblue">
                    Bio
                </label>
                <textarea
                    value={initialData?.bio || ""}
                    disabled={isReadOnly}
                    onChange={(e) => onChange?.("bio", e.target.value)}
                    className={`${inputClasses} h-24 resize-none`}
                />
            </div>
        </div>
    );
}
