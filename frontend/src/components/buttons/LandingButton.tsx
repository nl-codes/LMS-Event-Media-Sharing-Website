import clsx from "clsx";
import { ButtonProps } from "./buttonDefinition";

export default function LandingButton({ children, className }: ButtonProps) {
    return (
        <button
            className={clsx(
                "bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet ",
                className
            )}>
            {children}
        </button>
    );
}
