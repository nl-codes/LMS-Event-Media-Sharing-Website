"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import default_profile from "public/profile-male.png";
import { Profile } from "@/types/Profile";
import { Camera } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { Country } from "country-state-city";

export type ProfileFormData = {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string | File | null;
    gender: string;
    country: string;
};

type ProfileFormProps = {
    initialData: Profile | ProfileFormData | null;
    onChange?: (field: keyof ProfileFormData, value: string | File) => void;
};

const ALL_COUNTRIES = Country.getAllCountries();

export default function ProfileForm({
    initialData,
    onChange,
}: ProfileFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string>("");
    const [countrySearch, setCountrySearch] = useState("");
    const [countryOpen, setCountryOpen] = useState(false);

    const inputClasses =
        "w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-cusblue focus:bg-white focus:ring-4 focus:ring-cusblue/10 transition-all duration-200 outline-none text-gray-700 font-medium";
    const labelClasses =
        "block text-xs font-bold uppercase tracking-widest text-cusblue/60 mb-2 ml-1";

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onChange) {
            onChange("profilePicture", file);
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

    const currentCountryCode =
        (initialData as ProfileFormData | null)?.country ??
        (initialData as Profile | null)?.country ??
        "";

    const currentCountryName =
        ALL_COUNTRIES.find((c) => c.isoCode === currentCountryCode)?.name ?? "";

    const filteredCountries = ALL_COUNTRIES.filter(
        (c) =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.isoCode.toLowerCase().includes(countrySearch.toLowerCase()),
    );

    const handleCountrySelect = (isoCode: string) => {
        onChange?.("country", isoCode);
        setCountrySearch("");
        setCountryOpen(false);
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

                {/* Gender */}
                <div className="space-y-1">
                    <label className={labelClasses}>Gender</label>
                    <div className="flex gap-3">
                        {(["male", "female", "other"] as const).map((g) => {
                            const currentGender =
                                (initialData as ProfileFormData | null)
                                    ?.gender ??
                                (initialData as Profile | null)?.gender ??
                                "";
                            const selected = currentGender === g;
                            return (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => onChange?.("gender", g)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all border ${
                                        selected
                                            ? "bg-linear-to-r from-cusblue to-cusviolet text-white border-transparent shadow"
                                            : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                                    }`}>
                                    {g}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Country */}
                <div className="space-y-1 relative">
                    <label className={labelClasses}>Country</label>
                    <button
                        type="button"
                        onClick={() => setCountryOpen((o) => !o)}
                        className={`${inputClasses} text-left flex items-center justify-between gap-3`}>
                        <span className="flex items-center gap-2 min-w-0">
                            {currentCountryCode ? (
                                <>
                                    <ReactCountryFlag
                                        countryCode={currentCountryCode}
                                        svg
                                        style={{
                                            width: "1.4em",
                                            height: "1.4em",
                                            borderRadius: "3px",
                                        }}
                                    />
                                    <span className="truncate">
                                        {currentCountryName}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-400">
                                    Select your country
                                </span>
                            )}
                        </span>
                        <svg
                            className="w-4 h-4 text-gray-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>

                    {countryOpen && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl ring-1 ring-cusblue/10 overflow-hidden">
                            <div className="p-2 border-b border-gray-50">
                                <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={(e) =>
                                        setCountrySearch(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-cusblue/20"
                                    autoFocus
                                />
                            </div>
                            <ul className="max-h-48 overflow-y-auto">
                                {currentCountryCode && (
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCountrySelect("")
                                            }
                                            className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 transition-colors italic">
                                            Clear selection
                                        </button>
                                    </li>
                                )}
                                {filteredCountries.length === 0 ? (
                                    <li className="px-4 py-3 text-sm text-gray-400 text-center">
                                        No countries found
                                    </li>
                                ) : (
                                    filteredCountries.map((c) => (
                                        <li key={c.isoCode}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCountrySelect(
                                                        c.isoCode,
                                                    )
                                                }
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                                                    currentCountryCode ===
                                                    c.isoCode
                                                        ? "bg-cusblue/5 text-cusblue font-bold"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}>
                                                <ReactCountryFlag
                                                    countryCode={c.isoCode}
                                                    svg
                                                    style={{
                                                        width: "1.4em",
                                                        height: "1.4em",
                                                        borderRadius: "3px",
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <span>{c.name}</span>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
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
