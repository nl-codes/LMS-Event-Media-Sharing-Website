"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { backend_url } from "@/config/backend";
import Button from "@/components/buttons/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import default_profile from "public/profile-male.png";
import { Profile } from "@/types/Profile";
import { Mail, Calendar, Edit3, Trash2 } from "lucide-react";
import { FiUser } from "react-icons/fi";

export default function ProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notCreated, setNotCreated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${backend_url}/users/profile`, {
                    credentials: "include",
                });
                if (!res.ok) {
                    if (res.status === 404) {
                        setNotCreated(true);
                        setProfile(null);
                    } else {
                        throw new Error("Could not fetch profile");
                    }
                } else {
                    const data = await res.json();
                    setProfile(data.profile);
                    setNotCreated(false);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your profile?"))
            return;
        const deletePromise = fetch(`${backend_url}/users/profile`, {
            method: "DELETE",
            credentials: "include",
        });

        toast.promise(deletePromise, {
            loading: "Deleting profile...",
            success: () => {
                setProfile(null);
                setNotCreated(true);
                return "Profile deleted successfully";
            },
            error: "Failed to delete profile",
        });
    };

    if (loading)
        return (
            <div className="flex justify-center p-20 animate-pulse text-cusblue font-medium">
                Loading Profile...
            </div>
        );

    if (notCreated || !profile)
        return (
            <div className="flex flex-col text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="bg-cuscream w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUser className="text-2xl text-cusblue" />
                </div>
                <h3 className="text-lg font-bold text-cusblue">
                    No Profile Found
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                    Let&apos;s get your profile set up in a few clicks.
                </p>
                <Button
                    handleClick={() => router.push("/home/profile/create")}
                    className="bg-cusblue text-white px-8 py-3 rounded-xl font-bold">
                    Create Now
                </Button>
            </div>
        );

    return (
        <div className="overflow-hidden bg-white shadow-2xl rounded-3xl w-full max-w-lg mx-auto transition-all duration-300 hover:shadow-cusblue/10">
            {/* Top Decorative Banner */}
            <div className="h-32 bg-linear-to-r from-cusblue to-cusviolet w-full" />

            <div className="relative px-8 pb-8">
                {/* Profile Image Overlay */}
                <div className="relative -top-12 -mb-8 flex justify-between items-end">
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
                        <Image
                            src={profile.profilePicture || default_profile}
                            alt="Profile"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => router.push("/home/profile/edit")}
                            className="p-3 bg-gray-100 hover:bg-cusblue hover:text-white rounded-xl transition-colors text-gray-600"
                            title="Edit Profile">
                            <Edit3 size={18} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-3 bg-gray-100 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-gray-600"
                            title="Delete Profile">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* User Identity */}
                <div className="mt-2">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                        {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-cusblue font-medium flex items-center gap-1">
                        @{profile.user?.userName || "username"}
                    </p>
                </div>

                {/* Bio Section */}
                <div className="mt-6">
                    <h3 className="text-xs font-uppercase tracking-widest text-gray-400 font-bold mb-2 uppercase">
                        About Me
                    </h3>
                    <p className="text-gray-600 leading-relaxed italic">
                        {profile.bio || "This user hasn't written a bio yet."}
                    </p>
                </div>

                {/* Info Grid */}
                <div className="mt-8 pt-6 border-t border-gray-50 grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 text-gray-600">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-cusblue">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                Email Address
                            </p>
                            <p className="text-sm font-medium">
                                {profile.user?.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-600">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                Joined / Updated
                            </p>
                            <p className="text-sm font-medium">
                                {new Date(profile.updatedAt).toLocaleDateString(
                                    undefined,
                                    {
                                        month: "long",
                                        year: "numeric",
                                    },
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
