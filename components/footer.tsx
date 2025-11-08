import Image from "next/image";
import finaceverseLogo from "@/attached_assets/FinACEverse Transparent symbol (1)_1761717040611-DUjk4bpq_1762638625992.png";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <Image 
            src={finaceverseLogo} 
            alt="FinACEverse" 
            width={20} 
            height={20}
            className="inline-block"
          />
          <span className="font-medium text-[#E07A5F]">FinACEverse</span>
        </div>
      </div>
    </footer>
  );
}
