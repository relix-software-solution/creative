export function AdminLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(168,128,66,0.95),transparent_18%),radial-gradient(circle_at_65%_30%,rgba(168,128,66,0.75),transparent_12%),radial-gradient(circle_at_55%_70%,rgba(168,128,66,0.55),transparent_14%)]" />
        <span className="relative text-lg font-extrabold text-[#A88042]">
          C
        </span>
      </div>

      <div>
        <h1 className="text-lg font-extrabold leading-none text-white">
          Creative Group
        </h1>
        <p className="mt-1 text-xs text-white/55">For Event Services</p>
      </div>
    </div>
  );
}
