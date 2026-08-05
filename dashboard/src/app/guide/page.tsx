import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_ARTICLES } from "@/content/guide";
import { ChevronRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "DPDP Act Guide — DPDP AI Scanner",
  description:
    "A plain-language guide to India's Digital Personal Data Protection Act 2023: rights, obligations, penalties, AI/cross-border transfer, and the implementation timeline.",
};

export default function GuideIndexPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <p className="chip animate-in">DPDP Act 2023</p>
      <h1 className="animate-in font-display mt-4 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
        A plain-language guide to the DPDP Act
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
        What India&apos;s data protection law actually requires, why it applies to AI vendor
        calls in your codebase, and what&apos;s live today versus what&apos;s still coming. Every
        article cites its sources — this is background reading, not legal advice.
      </p>

      <ul className="mt-10 space-y-3">
        {GUIDE_ARTICLES.map((article, i) => (
          <li key={article.slug}>
            <Link
              href={`/guide/${article.slug}`}
              className="card card-interactive animate-in flex items-center justify-between gap-4 p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-ink">{article.title}</h2>
                <p className="mt-1 text-sm text-ink-muted">{article.dek}</p>
                <p className="mt-2 text-xs text-ink-faint">{article.readMinutes} min read</p>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
