import { Monogram } from "@/components/brand/Logo";

/** Shown only if a story route is not yet ready — a calm, branded pause. */
export default function StoriesLoading() {
  return (
    <div role="status" className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-porcelain text-olive">
      <Monogram className="h-12 w-12 animate-pulse motion-reduce:animate-none" />
      <p className="meta text-[0.6rem] text-muted">Opening the story…</p>
    </div>
  );
}
