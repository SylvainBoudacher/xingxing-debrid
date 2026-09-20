import { MAX_PENDING } from "../../core/sachets";

export function SachetPack({ pending, onOpen }: { pending: number; onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex h-[112px] w-[88px] items-end justify-center rounded-b-xl rounded-t-md pb-2.5 text-[11px] shadow-[inset_0_0_0_3px_#6a4428,0_6px_14px_rgba(0,0,0,.5)] ${
          pending
            ? "bg-gradient-to-b from-[#caa46a] to-[#a9804a] text-[#3a2418]"
            : "bg-[#5a4a3a] text-[#8a7a6a]"
        }`}
      >
        Sachet du jour
      </div>
      <button
        onClick={onOpen}
        disabled={!pending}
        className="rounded-lg border border-amber-300/50 bg-amber-300/15 px-5 py-1.5 font-serif text-[15px] text-[#f3dca0] hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ouvrir
      </button>
      <p className="text-[11px] text-[#a99a8a]">
        {pending > 0
          ? `${pending} en attente (${MAX_PENDING} au maximum)`
          : "Prochain sachet à minuit"}
      </p>
    </div>
  );
}
