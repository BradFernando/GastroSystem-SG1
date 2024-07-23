import { prisma } from '@/src/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { period } = req.query;
  const { startDate, endDate } = req.query;

  try {
    let revenueData;

    if (period === 'daily') {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required for daily view' });
      }

      revenueData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', "date") as date,
          SUM("total") as total
        FROM "Order"
        WHERE "status" = true AND "date" BETWEEN ${new Date(startDate as string)} AND ${new Date(endDate as string)}
        GROUP BY DATE_TRUNC('day', "date")
        ORDER BY date;
      `;
    } else if (period === 'monthly') {
      revenueData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "date") as date,
          SUM("total") as total
        FROM "Order"
        WHERE "status" = true
        GROUP BY DATE_TRUNC('month', "date")
        ORDER BY date;
      `;
    } else {
      return res.status(400).json({ error: 'Invalid period parameter' });
    }

    res.status(200).json({ [`${period}Revenue`]: revenueData });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
