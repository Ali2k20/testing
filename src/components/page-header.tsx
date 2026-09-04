export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="border-b border-line bg-sand">
      <div className="mx-auto max-w-[1400px] px-5 py-16 lg:px-10 lg:py-24">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] font-light sm:text-6xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">{intro}</p>
        )}
      </div>
    </header>
  );
}
