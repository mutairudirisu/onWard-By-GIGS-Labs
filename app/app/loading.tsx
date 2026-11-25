import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center p-6 text-center">
      <LoadingState variant="page" label="Loading…" />
    </div>
  );
}
