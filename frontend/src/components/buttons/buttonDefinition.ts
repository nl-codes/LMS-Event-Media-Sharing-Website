export interface ButtonProps {
    type?: "button" | "submit";
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    handleClick?: () => void;
}
