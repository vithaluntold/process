"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface EnhancedInputProps extends React.ComponentProps<typeof Input> {
  label?: string
  error?: string
  success?: boolean
  hint?: string
  loading?: boolean
  onValidate?: (value: string) => string | undefined
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, label, error, success, hint, loading, onValidate, onChange, ...props }, ref) => {
    const [validationError, setValidationError] = React.useState<string | undefined>()
    const [touched, setTouched] = React.useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValidate && touched) {
        setValidationError(onValidate(e.target.value))
      }
      onChange?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      if (onValidate) {
        setValidationError(onValidate(e.target.value))
      }
      props.onBlur?.(e)
    }

    const displayError = error || validationError
    const showSuccess = success && !displayError && touched

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "transition-all",
              displayError && "border-destructive focus-visible:ring-destructive/20",
              showSuccess && "border-emerald-500 focus-visible:ring-emerald-500/20",
              className
            )}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                </motion.div>
              )}
              {!loading && showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </motion.div>
              )}
              {!loading && displayError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {displayError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {displayError}
            </motion.p>
          )}
          {!displayError && hint && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

EnhancedInput.displayName = "EnhancedInput"
