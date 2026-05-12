interface SectionEyebrowProps {
  label: string;
  centered?: boolean;
}

export function SectionEyebrow({ label, centered = false }: SectionEyebrowProps) {
  return (
    <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
      <div className={`${centered ? "w-6" : "w-6"} h-px bg-[#C9A84C]`} />
      <span
        className="text-[#C9A84C] font-inter uppercase"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.68rem",
          letterSpacing: "0.3em",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {centered && <div className="w-6 h-px bg-[#C9A84C]" />}
    </div>
  );
}
