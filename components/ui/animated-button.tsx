"use client"

import { motion } from "framer-motion"
import { Button, buttonVariants } from "@/components/ui/button"
import { forwardRef } from "react"
import type { VariantProps } from "class-variance-authority"

interface AnimatedButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  hoverScale?: number
  tapScale?: number
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, hoverScale = 1.02, tapScale = 0.98, className, variant, size, asChild, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: tapScale }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ display: "inline-block" }}
      >
        <Button ref={ref} className={className} variant={variant} size={size} asChild={asChild} {...props}>
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"
