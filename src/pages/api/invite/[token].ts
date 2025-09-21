import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

interface InviteData {
  id: number;
  event_id: number;
  name: string;
  token: string;
  confirmed: boolean;
  num_people: number;
  created_at: string;
  event_name: string;
  description?: string;
  message?: string;
  photos?: string | string[];
  location?: string;
  date?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  
  if (req.method === 'GET') {
    const query = `
      SELECT g.*, e.name as event_name, e.description, e.message, 
             e.photos, e.location, e.date
      FROM guests g
      JOIN events e ON g.event_id = e.id
      WHERE g.token = ?
    `;
    
    try {
      const invite: InviteData | null = await db.get(query, [token]);
      
      if (!invite) {
        res.status(404).json({ error: 'Convite não encontrado' });
        return;
      }
      
      const response = {
        ...invite,
        photos: typeof invite.photos === 'string' ? JSON.parse(invite.photos || '[]') : (invite.photos || [])
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Error fetching invite:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
