import UnsignedHeader from "@/components/headers/UnsignedHeader";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <UnsignedHeader />
            {children}
        </>
    );
}
