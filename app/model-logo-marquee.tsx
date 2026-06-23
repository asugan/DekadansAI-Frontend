import Image from "next/image";

import { getModelPresentation, getProviderDisplayName } from "@/lib/model-presentation";

interface MarqueeModel {
  id: string;
  name: string;
  provider: string | null;
}

interface ModelLogoMarqueeProps {
  models: MarqueeModel[];
}

export function ModelLogoMarquee({ models }: ModelLogoMarqueeProps) {
  const renderModels = (group: string) =>
    models.map((model) => {
      const presentation = getModelPresentation(model);

      return (
        <div
          className="group flex min-w-44 items-center gap-3 rounded-full border border-white/10 bg-black/70 px-4 py-3 shadow-[0_0_30px_rgba(0,242,255,0.06)] backdrop-blur-md transition hover:border-cyan-200/25 hover:bg-white/[0.06]"
          key={`${group}-${model.id}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white p-1.5 shadow-[0_0_18px_rgba(0,242,255,0.14)]">
            <Image
              alt={`${model.name} logo`}
              className="h-full w-full object-contain"
              height={36}
              src={presentation.logo}
              width={36}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.03em] text-white">
              {model.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.12em] text-white/35">
              {getProviderDisplayName()}
            </p>
          </div>
        </div>
      );
    });

  return (
    <div className="relative mx-auto mb-10 max-w-5xl overflow-hidden py-5">
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-black to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-black to-transparent" />
      <div className="absolute inset-x-20 top-1/2 h-16 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="model-logo-marquee flex w-max gap-3">
        <div className="flex gap-3">{renderModels("primary")}</div>
        <div className="flex gap-3" aria-hidden="true">
          {renderModels("duplicate")}
        </div>
      </div>
    </div>
  );
}
