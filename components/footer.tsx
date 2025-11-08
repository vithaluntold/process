import Image from "next/image";
import finaceverseLogo from "@/attached_assets/FinACEverse Transparent symbol (1)_1761717040611-DUjk4bpq_1762638625992.png";

export function Footer() {
  return (
    <footer className="sticky bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Powered by</span>
          <Image 
            src={finaceverseLogo} 
            alt="FinACEverse" 
            width={24} 
            height={24}
            className="inline-block"
          />
          <span className="font-bold text-lg bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
            FinACEverse
          </span>
        </div>
      </div>
    </footer>
  );
}
