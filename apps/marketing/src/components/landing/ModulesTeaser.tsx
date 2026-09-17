import { ArrowLeft } from 'lucide-react';
import { MODULE_TEASERS } from '../../lib/modules';

export function ModulesTeaser() {
  return (
    <section id="modules" className="section-pad">
      <div className="container-site">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="eyebrow mx-auto">מודולים במערכת אחת</p>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
            CRM, אוטומציות ואינטגרציות — בלי לקפוץ בין כלים.
          </h2>
          <p className="prose-site mx-auto mt-4">
            המודולים בנויים יחד: ליד שנכנס מהפרסום עובר לשיחה, למשפך ולפולו־אפ —
            ואתה רואה הכל באותו מקום.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {MODULE_TEASERS.map((mod) => (
            <a
              key={mod.id}
              href={mod.href}
              className="bento-card reveal group flex cursor-pointer flex-col transition hover:border-cta/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-dark))] text-white shadow-soft">
                <mod.icon className="size-5" aria-hidden />
              </div>
              <span className="text-xs font-semibold text-cta">{mod.eyebrow}</span>
              <h3 className="mt-2 text-xl font-bold group-hover:text-cta">{mod.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {mod.body}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                לפרטים
                <ArrowLeft
                  className="size-4 transition group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
