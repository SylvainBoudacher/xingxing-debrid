import type { NodeState } from "../../core/progression";
import { LOCKED } from "./nodeStyle";
import { vinePath, vinePointAt, type Point } from "./vines";

const LEAVES = [0.35, 0.65];
const LEAF = "#7fbf4e";

// `state` est celui de l'enfant : la liane pousse quand le parent est terminé
export function Vine({
  from,
  to,
  state,
  color,
}: {
  from: Point;
  to: Point;
  state: NodeState;
  color: string;
}) {
  const d = vinePath(from, to);
  if (state === "verrouille")
    return (
      <path
        d={d}
        fill="none"
        stroke={LOCKED}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
    );
  const done = state === "termine";
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#000"
        strokeOpacity="0.35"
        strokeWidth={done ? 9 : 7}
        strokeLinecap="round"
        transform="translate(0 3)"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeOpacity={done ? 1 : 0.55}
        strokeWidth={done ? 6 : 4.5}
        strokeLinecap="round"
      />
      {done &&
        LEAVES.map((t) => {
          const p = vinePointAt(from, to, t);
          const side = t < 0.5 ? 1 : -1;
          return (
            <ellipse
              key={t}
              cx={p.x + side * 9}
              cy={p.y}
              rx="10"
              ry="5"
              fill={LEAF}
              transform={`rotate(${side * -30} ${p.x} ${p.y})`}
            />
          );
        })}
    </g>
  );
}
