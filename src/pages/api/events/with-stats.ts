import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

interface EventWithStats {
  id: number;
  name: string;
  description?: string;
  message?: string;
  photos: string[];
  location?: string;
  date?: string;
  created_at: string;
  total_guests: number;
  confirmed_guests: number;
  total_people: number;
  pending_guests: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const events = await db.all(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.message,
          e.photos,
          e.location,
          e.date,
          e.created_at,
          COUNT(g.id) as total_guests,
          COUNT(CASE WHEN g.confirmed = 1 THEN 1 END) as confirmed_guests,
          COALESCE(SUM(CASE WHEN g.confirmed = 1 THEN g.num_people ELSE 0 END), 0) as total_people,
          COUNT(CASE WHEN g.confirmed = 0 OR g.confirmed IS NULL THEN 1 END) as pending_guests
        FROM events e
        LEFT JOIN guests g ON e.id = g.event_id
        GROUP BY e.id, e.name, e.description, e.message, e.photos, e.location, e.date, e.created_at
        ORDER BY e.created_at DESC
      `);

      const eventsWithStats: EventWithStats[] = events.map((event: any) => {
        let photos = [];
        try {
          photos = event.photos ? JSON.parse(event.photos) : [];
        } catch (e) {
          console.error('Error parsing photos JSON:', e);
          photos = [];
        }
        
        return {
          ...event,
          photos
        };
      });

      res.json(eventsWithStats);
    } catch (error: any) {
      console.error('Error fetching events with stats:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
