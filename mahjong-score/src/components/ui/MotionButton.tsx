import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "ghost" | "glass" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
    children: ReactNode;
}

export function MotionButton({
    className,
    variant = "primary",
    size = "md",
    children,
    ...props
}: MotionButtonProps) {
    const variants = {
        primary: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        glass: "glass hover:bg-white/20 text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    const sizes = {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-8 text-base",
        lg: "h-14 px-10 text-lg font-medium",
        icon: "h-10 w-10",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
                "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
