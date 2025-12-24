import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    gradient?: boolean;
}

export function GlassCard({ className, children, gradient, ...props }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "glass-card p-6 relative overflow-hidden",
                gradient && "bg-gradient-to-br from-white/10 to-white/5",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
