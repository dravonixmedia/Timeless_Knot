"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Props = {
  /** id of the trigger (the field's <label htmlFor> points at it). */
  id: string;
  /** id of the visible label, which names the combobox. */
  labelId: string;
  name: string;
  value: string;
  options: readonly string[];
  /** Shown while nothing is chosen; also offered as the first option, to clear the choice. */
  placeholder: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
};

/**
 * A refined single-choice dropdown in the editorial style (ivory panel,
 * charcoal type, hairline borders) in place of the browser's own list, built
 * on the WAI-ARIA "select-only combobox" pattern:
 *
 * - The trigger (role="combobox") keeps focus; the open list is a listbox and
 *   the highlighted option is announced through aria-activedescendant.
 * - Keys: ↓/↑/Enter/Space/Home/End open it; ↓ ↑ Home End PageUp PageDown move;
 *   Enter, Space or Tab choose; Escape closes without changing; Alt+↑ chooses
 *   and closes; typing letters jumps to a matching option.
 * - Pointer and touch: tap the field to open, tap an option to choose, tap
 *   anywhere else to close. Options are at least 44 px tall.
 */
export function CelebrationSelect({ id, labelId, name, value, options, placeholder, onChange, onBlur, invalid, describedBy }: Props) {
  // Index 0 is the placeholder ("no choice"); 1… are the options.
  const items = [{ value: "", label: placeholder }, ...options.map((o) => ({ value: o, label: o }))];
  const selected = Math.max(0, items.findIndex((item) => item.value === value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const optionId = (i: number) => `${id}-option-${i}`;

  const show = (index: number) => {
    setActive(index);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const choose = (index: number) => {
    if (items[index].value !== value) onChange(items[index].value);
    close();
  };

  // Keep the highlighted option in view as it moves.
  useEffect(() => {
    if (open) list.current?.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: "nearest" });
    // optionId depends only on id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  // A tap or click anywhere outside closes the list (touch screens may not blur the trigger).
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  /** Type-to-select: letters typed within half a second build one search. */
  const match = (key: string) => {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < 500 ? typed.current.text : "") + key.toLowerCase(), at: now };
    const start = open ? active : selected;
    const order = [...items.keys()].slice(1);
    const rotated = [...order.slice(start), ...order.slice(0, start)];
    return rotated.find((i) => items[i].label.toLowerCase().startsWith(typed.current.text)) ?? -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = items.length - 1;
    const { key, altKey } = event;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        show(selected);
      } else if (key === "Home" || key === "End") {
        event.preventDefault();
        show(key === "Home" ? 0 : last);
      } else if (key.length === 1 && /\S/.test(key) && !event.metaKey && !event.ctrlKey) {
        const found = match(key);
        if (found !== -1) show(found);
      }
      return;
    }
    const move = (to: number) => {
      event.preventDefault();
      setActive(Math.max(0, Math.min(last, to)));
    };
    if (key === "ArrowDown") move(active + 1);
    else if (key === "ArrowUp" && altKey) {
      event.preventDefault();
      choose(active);
    } else if (key === "ArrowUp") move(active - 1);
    else if (key === "Home") move(0);
    else if (key === "End") move(last);
    else if (key === "PageDown") move(active + 10);
    else if (key === "PageUp") move(active - 10);
    else if (key === "Enter" || key === " ") {
      event.preventDefault();
      choose(active);
    } else if (key === "Escape") {
      event.preventDefault();
      close();
    } else if (key === "Tab") choose(active);
    else if (key.length === 1 && /\S/.test(key) && !event.metaKey && !event.ctrlKey) {
      const found = match(key);
      if (found !== -1) setActive(found);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : show(selected))}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!root.current?.contains(event.relatedTarget as Node)) close();
          onBlur();
        }}
        className="field flex cursor-pointer items-center justify-between gap-4 text-left"
      >
        <span className={value ? "" : "text-muted"}>{items[selected].label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={`h-2 w-3 shrink-0 transition-transform duration-500 ease-[var(--ease-editorial)] ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
        >
          <path d="M1 1l5 5 5-5" />
        </svg>
      </button>

      <ul
        ref={list}
        id={`${id}-listbox`}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        // Keep focus on the trigger while choosing with a pointer.
        onMouseDown={(event) => event.preventDefault()}
        className="celebration-listbox absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto overscroll-contain border border-charcoal/15 bg-porcelain py-2 shadow-[0_24px_48px_-28px_rgb(41_45_41/0.35)]"
      >
        {items.map((item, i) => {
          const isSelected = i === selected;
          return (
            <li
              key={item.label}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              onPointerMove={() => active !== i && setActive(i)}
              onClick={() => choose(i)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5 py-3 text-[0.95rem] transition-colors duration-200 ${
                i === active ? "bg-pale-sage/70" : ""
              } ${i === 0 ? "text-muted" : "text-charcoal"} ${isSelected && i !== 0 ? "font-medium" : ""}`}
            >
              <span>{item.label}</span>
              {isSelected && i !== 0 && (
                <svg aria-hidden="true" viewBox="0 0 14 10" className="h-2.5 w-3.5 shrink-0 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 5l4 4 8-8" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
