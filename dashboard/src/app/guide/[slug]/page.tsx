import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_ARTICLES, getGuideArticle } from "@/content/guide";
import { ArrowUpRightIcon } from "@/components/icons";

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — DPDP AI Scanner Guide`,
    description: article.dek,
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <Link href="/guide" className="text-sm text-ink-muted hover:text-ink">
        ← Guide
      </Link>

      <h1 className="font-display mt-4 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
        {article.title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">{article.dek}</p>
      <p className="mt-3 text-xs text-ink-faint">
        {article.readMinutes} min read · updated {article.updated}
      </p>

      <div className="prose-guide mt-8">
        {article.sections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-10 card p-5">
        <p className="text-xs font-medium text-ink-muted">
          This is background reading, not legal advice — verify against the primary sources
          below and consult qualified counsel before relying on it.
        </p>
        <p className="mt-3 text-xs font-medium text-ink">Sources</p>
        <ul className="mt-2 space-y-1.5">
          {article.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand"
              >
                {source.title}
                <ArrowUpRightIcon className="h-3 w-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
