export default function DemoLabel({ text = "DEMO SIMULATION" }: { text?: string }) {
  return (
    <span className="badge-demo absolute top-4 left-4 z-10 pointer-events-none">
      {text}
    </span>
  );
}
