"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { backend_url } from "@/config/backend";
import LandingButton from "@/components/buttons/LandingButton";
import { useRouter } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { Profile } from "@/types/Profile";
import { useUser } from "@/context/UserContext";

export default function ProfileCard() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notCreated, setNotCreated] = useState(false);
    const router = useRouter();
    const { user } = useUser();

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
    }, [user]);

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

    if (loading) return <div className="text-center p-10">Loading...</div>;

    if (notCreated)
        return (
            <div className="text-center p-10 bg-cuscream rounded-xl">
                <p className="mb-4 font-semibold text-cusblue">
                    Profile not created
                </p>
                <LandingButton
                    handleClick={() => router.push("/home/profile/create")}>
                    Create Profile
                </LandingButton>
            </div>
        );

    if (!profile)
        return (
            <div className="text-center p-10 bg-cuscream rounded-xl">
                <p className="mb-4">No profile found.</p>
                <LandingButton
                    handleClick={() => router.push("/home/profile/create")}>
                    Create Profile
                </LandingButton>
            </div>
        );

    return (
        <div className="shadow-xl bg-cuscream rounded-xl p-8 w-[450px]">
            <h2 className="text-2xl font-bold text-cusblue mb-6 text-center">
                Your Profile
            </h2>

            <ProfileForm initialData={profile} isReadOnly={true} />

            <div className="flex gap-4 mt-8 justify-center">
                <LandingButton
                    handleClick={() => router.push("/home/profile/edit")}
                    className="bg-cusblue text-white px-6 py-2 rounded-lg font-bold">
                    Edit Profile
                </LandingButton>

                <LandingButton
                    handleClick={handleDelete}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold">
                    Delete Profile
                </LandingButton>
            </div>
        </div>
    );
}
