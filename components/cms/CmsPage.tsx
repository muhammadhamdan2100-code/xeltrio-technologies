import type { Metadata } from "next";
import { getPublishedPage, type PublishedPage } from "@/lib/cms/public";
import { Block } from "@/components/cms/CmsBlocks";

export async function CmsSections({ slug }: { slug: string }): Promise<React.ReactElement | null> {
  const page = await getPublishedPage(slug);
  if (!page || page.sections.length === 0) return null;
  return (
    <>
      {page.sections.map((section) => (
        <Block key={section.id} section={section} />
      ))}
    </>
  );
}

/**
 * SEO fields come from the published row only. A page that is draft, in review,
 * approved or archived returns null here, so its editorial metadata can never
 * reach a public <head>.
 */
export async function cmsMetadata(slug: string, fallback: Metadata): Promise<Metadata> {
  const page: PublishedPage | null = await getPublishedPage(slug);
  if (!page) return fallback;

  const title = page.seo_title?.trim() || page.title;
  const description = page.seo_description?.trim() || page.description || undefined;

  return {
    ...fallback,
    title,
    description,
    keywords: page.seo_keywords.length ? page.seo_keywords : fallback.keywords,
    robots: page.noindex ? { index: false, follow: false } : fallback.robots,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      title,
      description,
      url: page.route,
      images: page.og_image_url ? [{ url: page.og_image_url }] : (fallback.openGraph?.images ?? []),
    },
  };
}
