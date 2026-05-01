"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { backend_url } from "@/config/backend";
import ProfileForm, { ProfileFormData } from "../ProfileForm";
import Button from "@/components/buttons/Button";
import BackButton from "@/components/navigation/BackButton";
import { Profile } from "@/types/Profile";
import { Save, UserPlus } from "lucide-react";

export default function ProfileEditPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ProfileFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
        setSubmitting(true);

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

            if (!res.ok) throw new Error();
            toast.success(`Profile ${profileExists ? "updated" : "created"}!`);
            router.push("/home/profile");
            router.refresh();
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setSubmitting(false);
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
                    const p: Profile = data.profile;
                    setFormData({
                        firstName: p.firstName,
                        lastName: p.lastName,
                        bio: p.bio,
                        profilePicture: p.profilePicture,
                    });
                    setProfileExists(true);
                } else {
                    setFormData({
                        firstName: "",
                        lastName: "",
                        bio: "",
                        profilePicture: null,
                    });
                    setProfileExists(false);
                }
            } catch (err) {
                console.log(err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading)
        return (
            <div className="flex justify-center p-20 text-cusblue animate-pulse font-bold text-xl">
                Loading Editor...
            </div>
        );

    return (
        <main className="min-h-screen bg-cuscream py-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <BackButton label="Cancel" />
                    <div className="text-right">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            Settings
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">
                            {profileExists
                                ? "Update your personal info"
                                : "Set up your public identity"}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="relative bg-white shadow-2xl rounded-[2.5rem] p-10 pt-16 overflow-visible border border-white">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-r from-cusblue to-cusviolet rounded-t-[2.5rem]" />

                    <ProfileForm
                        initialData={formData}
                        onChange={handleChange}
                    />

                    <div className="mt-10">
                        <Button
                            disabled={submitting}
                            type="submit"
                            className="w-full bg-cusblue hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-cusblue/20 disabled:opacity-70">
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {profileExists ? (
                                        <Save size={20} />
                                    ) : (
                                        <UserPlus size={20} />
                                    )}
                                    {profileExists
                                        ? "Save Changes"
                                        : "Create Profile"}
                                </>
                            )}
                        </Button>
                        <p className="text-center text-[11px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
                            All fields are visible to other users
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
