import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://codeskill.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/problems',
          '/contests',
          '/leaderboard',
          '/discuss',
        ],
        disallow: [
          '/admin/',
          '/assessment/',
          '/campus/',
          '/company/',
          '/api/',
          '/_next/',
          '/login',
          '/register',
          '/student-login',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
