export function Footer() {
  return (
    <footer className="sticky bottom-0 left-0 right-0 z-40 border-t bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Powered by</span>
          <span className="font-bold text-lg bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
            FinACEverse
          </span>
        </div>
      </div>
    </footer>
  );
}
