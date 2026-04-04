import { confirmAlert } from "react-confirm-alert";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/buttons/Button";
import React from "react";

// Define the available popup types
type PopUpType = "success" | "error" | "email";

interface PopUpProps {
    title: string;
    message: string;
    type?: PopUpType;
    confirmLabel?: string;
    onConfirm?: () => void;
}

export const showPopUp = ({
    title,
    message,
    type = "success",
    confirmLabel = "OK",
    onConfirm,
}: PopUpProps): void => {
    confirmAlert({
        customUI: ({ onClose }: { onClose: () => void }) => {
            // Icon and Color Mapping
            const getIconSettings = () => {
                switch (type) {
                    case "success":
                        return {
                            icon: React.createElement(CheckCircle2, {
                                className: "w-8 h-8",
                            }),
                            containerClass: "bg-green-100 text-green-600",
                        };
                    case "error":
                        return {
                            icon: React.createElement(AlertCircle, {
                                className: "w-8 h-8",
                            }),
                            containerClass: "bg-red-100 text-red-600",
                        };
                    case "email":
                        return {
                            icon: React.createElement(Mail, {
                                className: "w-8 h-8",
                            }),
                            containerClass: "bg-cusblue/10 text-cusblue",
                        };
                    default:
                        return {
                            icon: React.createElement(CheckCircle2, {
                                className: "w-8 h-8",
                            }),
                            containerClass: "bg-cusblue/10 text-cusblue",
                        };
                }
            };

            const settings = getIconSettings();

            // Create Button element with children properly passed
            const buttonElement = React.createElement(
                Button,
                {
                    handleClick: () => {
                        if (onConfirm) onConfirm();
                        onClose();
                    },
                    className: "w-full h-14 shadow-lg shadow-cusblue/10",
                },
                confirmLabel,
            );

            return React.createElement(
                "div",
                {
                    className:
                        "fixed inset-0 z-[9999] flex items-center justify-center bg-cusblue/20 backdrop-blur-md p-6",
                },
                React.createElement(
                    "div",
                    {
                        className:
                            "bg-white rounded-[2.5rem] border border-white p-8 lg:p-10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300",
                    },
                    React.createElement(
                        "div",
                        {
                            className:
                                "flex flex-col items-center text-center gap-5",
                        },
                        React.createElement(
                            "div",
                            {
                                className: `w-16 h-16 rounded-3xl flex items-center justify-center ${settings.containerClass}`,
                            },
                            settings.icon,
                        ),
                        React.createElement(
                            "div",
                            { className: "space-y-2" },
                            React.createElement(
                                "h2",
                                {
                                    className:
                                        "text-2xl font-black text-cusblue tracking-tight",
                                },
                                title,
                            ),
                            React.createElement(
                                "p",
                                {
                                    className:
                                        "text-cusviolet/70 font-medium leading-relaxed",
                                },
                                message,
                            ),
                        ),
                        buttonElement,
                    ),
                ),
            );
        },
        closeOnEscape: false,
        closeOnClickOutside: false,
    });
};
