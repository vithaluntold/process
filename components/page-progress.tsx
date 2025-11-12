"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function PageProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timeout = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
          initial={{ scaleX: 0, transformOrigin: "0%" }}
          animate={{ scaleX: 1, transformOrigin: "0%" }}
          exit={{ scaleX: 1, transformOrigin: "100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </AnimatePresence>
  )
}
