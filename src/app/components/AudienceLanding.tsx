import Link from "next/link";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";

interface AudienceLandingProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  steps: Array<{ title: string; description: string }>;
  destinations: Array<{ title: string; description: string; href: string; label: string }>;
  note: { title: string; description: string };
}

export default function AudienceLanding({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  steps,
  destinations,
  note,
}: AudienceLandingProps) {
  return (
    <main>
      <section className="border-b border-[#e5e5e5] bg-white px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#606060] hover:text-[#0f0f0f]">
            <ArrowLeft size={15} />
            APLZについて
          </Link>
          <div className="mt-10 grid gap-7 md:grid-cols-[56px_1fr]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[#dedede] bg-[#f7f7f5] text-[#1B4F72]">
              <Icon size={22} />
            </span>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#1B4F72]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-[#0f0f0f] sm:text-4xl">{title}</h1>
              <p className="mt-4 text-base leading-8 text-[#606060]">{description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={primaryAction.href}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1B4F72] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15415F]"
                >
                  {primaryAction.label}
                  <ArrowRight size={16} />
                </Link>
                {secondaryAction && (
                  <Link
                    href={secondaryAction.href}
                    className="inline-flex min-h-12 items-center rounded-lg border border-[#d7d7d7] bg-white px-5 py-3 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f5f5f5]"
                  >
                    {secondaryAction.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-[#f7f7f5] px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-[#0f0f0f]">進め方</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#dedede] bg-[#dedede] md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="bg-white p-5">
                <span className="font-mono text-xs font-semibold text-[#B83232]">0{index + 1}</span>
                <h3 className="mt-4 font-bold text-[#0f0f0f]">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#606060]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#e5e5e5] bg-white px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-[#0f0f0f]">ここから進む</h2>
          <div className="mt-6 divide-y divide-[#e5e5e5] border-y border-[#e5e5e5]">
            {destinations.map((destination) => (
              <Link
                key={destination.href}
                href={destination.href}
                className="group grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <h3 className="font-semibold text-[#0f0f0f]">{destination.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#606060]">{destination.description}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B4F72]">
                  {destination.label}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f7f5] px-4 py-12">
        <div className="mx-auto max-w-5xl border-l-2 border-[#B83232] pl-5">
          <h2 className="text-sm font-bold text-[#0f0f0f]">{note.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#606060]">{note.description}</p>
        </div>
      </section>
    </main>
  );
}
