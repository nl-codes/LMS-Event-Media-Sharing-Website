import { Toaster } from "react-hot-toast";

export default function CustomToast() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                // Default styles (applies to all)
                style: {
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },

                // Success toast styling
                success: {
                    iconTheme: {
                        primary: "#22c55e", // green-500
                        secondary: "#ffffff",
                    },
                    style: {
                        background: "#16a34a", // green-600
                    },
                },

                // Error toast styling
                error: {
                    iconTheme: {
                        primary: "#ef1111", // red-500
                        secondary: "#ffffff",
                    },
                    style: {
                        background: "#dc2121", // red-600
                    },
                },
            }}
        />
    );
}
