"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-[#0c3a2f] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0b4d3c] print:hidden"
    >
      {label}
    </button>
  );
}
