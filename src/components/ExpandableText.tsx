import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type ExpandableTextProps = {
  text: string;
  lines?: number;
  className?: string;
};

// Le texte est toujours rendu en entier : c'est le conteneur qui est ramene a
// la hauteur de N lignes, ce qui rend l'ouverture animable (hauteur en px).
export function ExpandableText({ text, lines = 4, className = "" }: ExpandableTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState({ collapsed: 0, full: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    setExpanded(false);
    setHeights({ collapsed: lineHeight * lines, full: el.scrollHeight });
  }, [text, lines]);

  const truncated = heights.full > heights.collapsed + 1;

  return (
    <div className={className}>
      <motion.div
        animate={{ height: expanded || !truncated ? heights.full : heights.collapsed }}
        initial={false}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
      >
        <p ref={ref} className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {text}
        </p>
      </motion.div>
      {truncated && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}
