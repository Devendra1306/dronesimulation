export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full opacity-70">
      <div className="w-8 h-8 border-2 border-border-strong border-t-accent rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-text-muted font-medium">{message}</p>
    </div>
  );
}
