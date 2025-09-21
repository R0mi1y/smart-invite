import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../../lib/database';

interface CompleteEventData {
  event: {
    id: number;
    name: string;
    description?: string;
    message?: string;
    photos: string[];
    location?: string;
    date?: string;
    created_at: string;
  };
  guests: Array<{
    id: number;
    name: string;
    token: string;
    confirmed: boolean;
    num_people: number;
    created_at: string;
  }>;
  stats: {
    total_guests: number;
    confirmed_guests: number;
    total_people: number;
    pending_guests: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
      
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const guests = await db.all('SELECT * FROM guests WHERE event_id = ? ORDER BY created_at DESC', [id]);
      
      const confirmedGuests = guests.filter((g: any) => g.confirmed);
      const totalPeople = confirmedGuests.reduce((sum: number, g: any) => sum + (g.num_people || 0), 0);
      
      const stats = {
        total_guests: guests.length,
        confirmed_guests: confirmedGuests.length,
        total_people: totalPeople,
        pending_guests: guests.filter((g: any) => !g.confirmed).length
      };

      let photos = [];
      try {
        photos = event.photos ? JSON.parse(event.photos) : [];
      } catch (e) {
        console.error('Error parsing photos JSON:', e);
        photos = [];
      }

      const completeData: CompleteEventData = {
        event: {
          ...event,
          photos
        },
        guests,
        stats
      };

      res.json(completeData);
    } catch (error: any) {
      console.error('Error fetching complete event data:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
