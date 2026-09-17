import { ArrowLeft } from 'lucide-react';
import { MODULE_TEASERS } from '../../lib/modules';

export function ModulesTeaser() {
  return (
    <section id="modules" className="section-pad bg-muted/35">
      <div className="container-site">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            CRM, אוטומציות ואינטגרציות — בלי לקפוץ בין כלים.
          </h2>
          <p className="prose-site mx-auto mt-4">
            המודולים בנויים יחד: ליד מהפרסום עובר לשיחה, למשפך ולפולו־אפ — ואתה רואה
            הכל באותו מקום.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {MODULE_TEASERS.map((mod) => (
            <a
              key={mod.id}
              href={mod.href}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft sm:p-8"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-dark))] text-white shadow-soft transition group-hover:bg-primary">
                <mod.icon className="size-5" aria-hidden />
              </div>
              <h3 className="text-xl font-bold tracking-tight group-hover:text-primary">
                {mod.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {mod.body}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
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
