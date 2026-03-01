import { toast, ToastOptions } from "react-hot-toast";

// Define the specific style for warnings to match your error/success
const warningOptions: ToastOptions = {
    icon: "⚠️",
    style: {
        background: "#d97706", // amber-600
        color: "#ffffff",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "0.9rem",
        fontWeight: 500,
    },
    iconTheme: {
        primary: "#fff",
        secondary: "#d97706",
    },
};

export const notify = {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    // Our custom warning method
    warn: (msg: string) => toast(msg, warningOptions),
    // Standard loading toast
    loading: (msg: string) => toast.loading(msg),
};
