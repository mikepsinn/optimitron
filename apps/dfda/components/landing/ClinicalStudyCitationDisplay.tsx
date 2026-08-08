import React from 'react';
import type { ClinicalStudyCitation } from '@/lib/types/clinical-study-citation';
import Link from 'next/link';
import { ExternalLink, BookOpen } from 'lucide-react';
import Image from 'next/image';

interface ClinicalStudyCitationDisplayProps {
  citation: ClinicalStudyCitation | { citations: ClinicalStudyCitation[] } | null | undefined;
}

/**
 * Extract domain from URL for favicon
 */
const getDomainFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
};

/**
 * Get Google favicon URL for a domain
 * Prioritizes title (which is often the domain) over parsing the URL
 */
const getFaviconUrl = (citation: { title?: string | null; url?: string | null }): string | null => {
  // First try to use the title if it looks like a domain (e.g., "nih.gov", "oup.com")
  if (citation.title && citation.title.includes('.') && !citation.title.includes(' ') && citation.title.length < 50) {
    return `https://www.google.com/s2/favicons?domain=https://${citation.title}&sz=32`;
  }

  // Fall back to extracting domain from URL
  if (citation.url) {
    const domain = getDomainFromUrl(citation.url);
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=https://${domain}&sz=32`;
    }
  }

  return null;
};

/**
 * Renders clinical study citation details in a structured format.
 */
export const ClinicalStudyCitationDisplay: React.FC<ClinicalStudyCitationDisplayProps> = ({ citation }) => {
  if (!citation) {
    return <p className="text-xs text-muted-foreground">Source information not available.</p>;
  }

  // Handle array of citations
  if ('citations' in citation && Array.isArray(citation.citations)) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-black uppercase">Sources:</p>
        <div className="space-y-2">
          {citation.citations.map((cit, idx) => {
            const faviconUrl = getFaviconUrl(cit);
            return (
              <div key={idx} className="border-2 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                {cit.url ? (
                  <Link href={cit.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 mt-0.5">
                      {faviconUrl ? (
                        <Image
                          src={faviconUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded"
                          unoptimized
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm group-hover:text-brutal-pink transition-colors break-words">
                        {cit.title || cit.url}
                      </div>
                      {cit.authors && cit.authors.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {cit.authors.slice(0, 3).join(', ')}
                          {cit.authors.length > 3 && ` et al.`}
                        </div>
                      )}
                      {(cit.journal_or_publisher || cit.publication_year) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {cit.journal_or_publisher}
                          {cit.journal_or_publisher && cit.publication_year && ', '}
                          {cit.publication_year}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-brutal-pink transition-colors" />
                  </Link>
                ) : (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm break-words">{cit.title || 'Unknown source'}</div>
                      {cit.authors && cit.authors.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {cit.authors.slice(0, 3).join(', ')}
                          {cit.authors.length > 3 && ` et al.`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle single citation
  const {
    title,
    authors,
    journal_or_publisher,
    publication_year,
    volume,
    issue,
    pages,
    doi,
    pmid,
    url,
    type
  } = citation as ClinicalStudyCitation;

  const faviconUrl = getFaviconUrl(citation as ClinicalStudyCitation);
  const authorString = authors && authors.length > 0 ? authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '') : null;

  const renderLink = (href: string | undefined | null, text: string, label: string) => {
    if (!href || typeof href !== 'string' || href.trim() === '') {
      return null;
    }
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold border-2 border-primary bg-brutal-cyan hover:bg-brutal-cyan/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-black uppercase">Source:</p>
      <div className="border-2 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            {faviconUrl ? (
              <Image
                src={faviconUrl}
                alt=""
                width={20}
                height={20}
                className="rounded"
                unoptimized
              />
            ) : (
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {title && <div className="font-bold text-sm mb-2 break-words">{title}</div>}
            {authorString && <div className="text-xs text-muted-foreground mb-1">{authorString}</div>}
            <div className="text-xs text-muted-foreground">
              {journal_or_publisher && <span className="font-medium">{journal_or_publisher}</span>}
              {journal_or_publisher && publication_year && <span>, </span>}
              {publication_year && <span>{publication_year}</span>}
              {volume && <span> Vol {volume}</span>}
              {issue && <span>({issue})</span>}
              {pages && <span>: pp {pages}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-muted">
          {doi && renderLink(`https://doi.org/${doi}`, `DOI: ${doi}`, 'DOI')}
          {pmid && renderLink(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, `PMID: ${pmid}`, 'PubMed')}
          {url && type !== 'journal_article' && type !== 'book' && renderLink(url, url, 'View Source')}
        </div>
      </div>
    </div>
  );
};
