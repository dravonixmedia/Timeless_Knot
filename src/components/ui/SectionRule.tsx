/**
 * Thin divider between two major sections that share a background. It draws
 * from left to right once, the first time it enters the viewport, via the
 * shared reveal observer (CSS: `[data-reveal="rule"]` in globals.css), and is
 * simply a static line without JavaScript or with reduced motion.
 */
export function SectionRule({ className = "", contained = true }: { className?: string; contained?: boolean }) {
  // `contained={false}` when already inside a `frame` container.
  return (
    <div aria-hidden="true" className={`${contained ? "frame" : ""} ${className}`}>
      <div className="section-rule h-px bg-charcoal/15" data-reveal="rule" suppressHydrationWarning />
    </div>
  );
}
