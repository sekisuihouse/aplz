import type { MetadataRoute } from "next";
import { ALL_ARTICLES } from "@/lib/articles";
import { GENERATED_TOOLS } from "@/lib/generated-tools";
import { createServerClient } from "@/lib/supabase";
import { USE_CASES } from "@/lib/use-cases";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createServerClient();
  const [{ data: requests }, { data: apps }] = await Promise.all([
    db
      .from("requests")
      .select("slug, updated_at, created_at")
      .eq("is_public", true)
      .neq("status", "hidden")
      .order("updated_at", { ascending: false })
      .limit(5000),
    db
      .from("apps")
      .select("slug, created_at, last_published_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/requests"), lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/apps"), lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: absoluteUrl("/use-cases"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/articles"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/tools"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/templates"), lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  const useCaseRoutes: MetadataRoute.Sitemap = USE_CASES.map((useCase) => ({
    url: absoluteUrl(`/use-cases/${useCase.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const articleRoutes: MetadataRoute.Sitemap = ALL_ARTICLES.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const requestRoutes: MetadataRoute.Sitemap = (requests ?? []).map((request) => ({
    url: absoluteUrl(`/requests/${request.slug}`),
    lastModified: new Date(request.updated_at || request.created_at),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const appRoutes: MetadataRoute.Sitemap = (apps ?? []).map((app) => ({
    url: absoluteUrl(`/apps/${app.slug}`),
    lastModified: new Date(app.last_published_at || app.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const toolRoutes: MetadataRoute.Sitemap = GENERATED_TOOLS.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticRoutes, ...useCaseRoutes, ...articleRoutes, ...toolRoutes, ...requestRoutes, ...appRoutes];
}
