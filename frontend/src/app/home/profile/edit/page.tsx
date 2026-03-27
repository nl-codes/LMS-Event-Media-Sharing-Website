"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { backend_url } from "@/config/backend";
import ProfileForm, { ProfileFormData } from "../ProfileForm";
import LandingButton from "@/components/buttons/LandingButton";
import BackButton from "@/components/navigation/BackButton";
import { Profile } from "@/types/Profile";

export default function ProfileEditPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ProfileFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileExists, setProfileExists] = useState(false);

    const handleChange = (
        field: keyof ProfileFormData,
        value: string | File,
    ) => {
        setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData) return;

        const data = new FormData();
        data.append("firstName", formData.firstName);
        data.append("lastName", formData.lastName);
        data.append("bio", formData.bio);

        if (formData.profilePicture instanceof File) {
            data.append("profilePicture", formData.profilePicture);
        }

        try {
            const method = profileExists ? "PUT" : "POST";
            const res = await fetch(`${backend_url}/users/profile`, {
                method,
                body: data,
                credentials: "include",
            });

            if (!res.ok)
                throw new Error(
                    `${profileExists ? "Update" : "Create"} failed`,
                );

            toast.success(
                `Profile ${profileExists ? "updated" : "created"} successfully!`,
            );
            router.replace("/home/profile");
        } catch {
            toast.error(
                `Failed to ${profileExists ? "update" : "create"} profile`,
            );
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${backend_url}/users/profile`, {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    const profile: Profile = data.profile;
                    setFormData({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        bio: profile.bio,
                        profilePicture: profile.profilePicture,
                    });
                    setProfileExists(true);
                } else if (res.status === 404) {
                    // Profile doesn't exist, set empty form for creation
                    setFormData({
                        firstName: "",
                        lastName: "",
                        bio: "",
                        profilePicture: null,
                    });
                    setProfileExists(false);
                } else {
                    throw new Error("Failed to fetch profile");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <main className="flex justify-center items-center min-h-[60vh] bg-cuscream p-4">
            <div className="w-[450px]">
                <div className="mb-6 flex flex-row items-center gap-4">
                    <BackButton label="Back to Profile" />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="shadow-xl bg-white rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-cusblue mb-6 text-center">
                        {profileExists ? "Edit Profile" : "Create Profile"}
                    </h2>
                    <ProfileForm
                        initialData={formData}
                        isReadOnly={false}
                        onChange={handleChange}
                    />
                    <div className="mt-8">
                        <LandingButton
                            type="submit"
                            className="w-full bg-cusblue text-white py-3 rounded-lg font-bold">
                            {profileExists
                                ? "Update Profile"
                                : "Create Profile"}
                        </LandingButton>
                    </div>
                </form>
            </div>
        </main>
    );
}
