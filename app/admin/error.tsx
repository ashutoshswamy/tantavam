"use client";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-kajal/10 bg-white p-6 shadow-sm">
      <h2 className="font-semibold">That didn&apos;t work</h2>
      <p className="mt-2 text-sm text-kajal/70">{error.message || "Something went wrong."}</p>
      <button onClick={retry} className="mt-5 rounded-md bg-rani px-4 py-2 text-sm font-medium text-mallige hover:bg-rani/90">
        Try again
      </button>
    </div>
  );
}
