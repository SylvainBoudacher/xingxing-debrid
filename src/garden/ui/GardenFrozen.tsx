export function GardenFrozen() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <div className="rounded-2xl border border-amber-300/25 bg-[#18141c]/75 px-5 py-3 text-center text-sm text-[#f4e6d0] backdrop-blur-md">
          <p className="font-semibold">Ton champ est ouvert dans la fenêtre Potager</p>
          <p className="mt-1 text-xs text-[#cbbba6]">Il reprendra vie à sa fermeture.</p>
        </div>
      </div>
    </div>
  );
}
