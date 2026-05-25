import type { MetadataRoute } from 'next';
import housesData from '@/data/housesData.json';
import commoditiesData from '@/data/commoditiesData.json';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'https://tokeshare.io';

const STATIC_ROUTES = [
  '',
  '/marketplace/real-estate',
  '/marketplace/commodities',
  '/marketplace/stock-etf',
  '/marketplace/stock-etf/tmc',
  '/marketplace/stock-etf/tsp500',
  '/marketplace/other',
  '/marketplace/other/french-tacos',
  '/partners',
  '/general-disclaimer',
  '/privacy-policy',
  '/terms-of-service',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));

  const houseEntries: MetadataRoute.Sitemap = (housesData as Array<{ id: string }>).map((house) => ({
    url: `${SITE_URL}/marketplace/real-estate/${house.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const commodityEntries: MetadataRoute.Sitemap = (commoditiesData as Array<{ name: string }>).map((commodity) => ({
    url: `${SITE_URL}/marketplace/commodities/${encodeURIComponent(commodity.name)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...houseEntries, ...commodityEntries];
}
