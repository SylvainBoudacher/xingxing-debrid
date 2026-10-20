import { TOOL_LABEL } from "../../core/inventory";
import type { Tool, ToolId } from "../../core/types";
import { toolIconUrl } from "./abriSprites";
import { ItemTile } from "./ItemTile";

const TOOLS: ToolId[] = ["beche", "arrosoir", "serfouette"];
const PLANKS =
  "repeating-linear-gradient(90deg, #7a4c24 0 46px, #5e3a1a 46px 48px), linear-gradient(180deg, #86562a, #6a4220)";

// Le râtelier : un panneau de planches, une barre et un crochet par outil.
export function ToolRack({
  rack,
  onWithdraw,
  onHover,
}: {
  rack: Tool[];
  onWithdraw: (id: ToolId) => void;
  onHover: (label: string | null) => void;
}) {
  return (
    <section
      aria-label="Râtelier"
      className="relative flex flex-col justify-between border-[3px] border-[#2e1a0c] px-3 pt-3 pb-3 shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
      style={{ background: PLANKS }}
    >
      <span className="absolute top-1.5 left-3 text-sm italic text-[#f0d8a0]">Râtelier</span>
      <div className="mt-6 grid grid-cols-3 justify-items-center">
        {TOOLS.map((id) => {
          const tool = rack.find((t) => t.id === id);
          return (
            <div key={id} className="flex flex-col items-center">
              <span className="z-10 h-3.5 w-3.5 rounded-full border-2 border-[#2a1808] bg-[#3a2412] shadow-[inset_0_1px_0_#7a5a38]" />
              <span className="-mt-0.5 h-3 w-1 bg-[#6a4a28]" />
              {tool ? (
                <ItemTile
                  item={{ kind: "tool", tool }}
                  className="h-16"
                  onClick={() => onWithdraw(id)}
                  onHover={onHover}
                />
              ) : (
                <div
                  className="flex h-16 w-14 items-center justify-center"
                  title={`${TOOL_LABEL[id]} : en poche`}
                >
                  <img
                    src={toolIconUrl(id)}
                    alt=""
                    className="h-10 w-10 object-contain opacity-15 brightness-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="mt-1 block h-2.5 border-y-2 border-[#2a1808] bg-[#52321a]" />
    </section>
  );
}
