// Instant feedback on navigation: a thin sweeping bar while the next page renders on the server.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-rani/20">
      <div className="h-full w-1/3 animate-[sweep_1s_ease-in-out_infinite_alternate] bg-rani" />
    </div>
  );
}
