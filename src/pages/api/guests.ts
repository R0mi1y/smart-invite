import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/database';
import { v4 as uuidv4 } from 'uuid';

interface Guest {
  id?: number;
  event_id?: number;
  name: string;
  token?: string;
  confirmed?: boolean;
  num_people?: number;
  created_at?: string;
}

interface GuestUpdateRequest {
  token: string;
  confirmed: boolean;
  numPeople?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { eventId, name }: { eventId: number; name: string } = req.body;
    
    if (!eventId || !name) {
      return res.status(400).json({ error: 'EventId e name são obrigatórios' });
    }
    
    const token = uuidv4();
    
    try {
      const result = await db.run(
        'INSERT INTO guests (event_id, name, token) VALUES (?, ?, ?)',
        [parseInt(eventId.toString()), name.trim(), token]
      );
      
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'localhost:3000';
      const link = `${protocol}://${host}${basePath}/convite/${token}`;
      
      res.json({ 
        id: result.lastID, 
        token,
        link,
        message: 'Convidado adicionado com sucesso!' 
      });
    } catch (error: any) {
      console.error('Error creating guest:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    const { token, confirmed, numPeople }: GuestUpdateRequest = req.body;
    
    try {
      await db.run(
        'UPDATE guests SET confirmed = ?, num_people = ? WHERE token = ?',
        [confirmed ? 1 : 0, numPeople || 1, token]
      );
      
      res.json({ message: 'Presença confirmada com sucesso!' });
    } catch (error: any) {
      console.error('Error updating guest:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
