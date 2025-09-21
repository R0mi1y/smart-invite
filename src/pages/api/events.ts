import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';

interface CustomImage {
  url: string;
  position: 'center-top' | 'center-bottom' | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
}

interface Event {
  id?: number;
  name: string;
  description?: string;
  message?: string;
  photos?: string[];
  location?: string;
  date?: string;
  custom_images?: CustomImage[];
  created_at?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, description, message, photos, location, date, custom_images }: Event = req.body;
    
    try {
      const result = await db.run(
        'INSERT INTO events (name, description, message, photos, location, date, custom_images) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, message, JSON.stringify(photos || []), location, date, JSON.stringify(custom_images || [])]
      );
      
      res.json({ id: result.lastID, message: 'Evento criado com sucesso!' });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const events = await db.all('SELECT * FROM events ORDER BY created_at DESC');
      
      const eventsWithPhotos = events.map((event: any) => ({
        ...event,
        photos: typeof event.photos === 'string' ? JSON.parse(event.photos || '[]') : (event.photos || []),
        custom_images: typeof event.custom_images === 'string' ? JSON.parse(event.custom_images || '[]') : (event.custom_images || [])
      }));
      
      res.json(eventsWithPhotos);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
