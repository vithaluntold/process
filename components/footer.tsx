import Link from "next/link";
import Image from "next/image";
import { Download } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Powered by</span>
            <div className="flex items-center gap-2">
              <Image 
                src="/images/finaceverse-symbol.png" 
                alt="FinACEverse" 
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                FinACEverse
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/downloads" className="flex items-center gap-1.5 hover:text-cyan-500 transition-colors">
              <Download className="h-4 w-4" />
              <span>Downloads</span>
            </Link>
            <a 
              href="https://github.com/finaceverse/epi-q" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-500 transition-colors"
            >
              GitHub
            </a>
            <span className="text-muted-foreground/50">© 2025 EPI-Q</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
