import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

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
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
      
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const eventWithParsedData = {
        ...event,
        photos: typeof event.photos === 'string' ? JSON.parse(event.photos || '[]') : (event.photos || []),
        custom_images: event.custom_images ? 
          (typeof event.custom_images === 'string' ? JSON.parse(event.custom_images) : event.custom_images) : 
          []
      };

      res.json(eventWithParsedData);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    const { name, description, message, photos, location, date, custom_images }: Event = req.body;
    
    try {
      // Converter data ISO para formato MySQL
      const mysqlDate = date ? new Date(date).toISOString().slice(0, 19).replace('T', ' ') : null;
      
      // Primeiro, tentar atualizar com custom_images
      try {
        await db.run(
          'UPDATE events SET name = ?, description = ?, message = ?, photos = ?, location = ?, date = ?, custom_images = ? WHERE id = ?',
          [name, description, message, JSON.stringify(photos || []), location, mysqlDate, JSON.stringify(custom_images || []), id]
        );
      } catch (columnError: any) {
        // Se a coluna não existir, adicionar ela primeiro
        if (columnError.message.includes('Unknown column')) {
          console.log('Adding custom_images column...');
          await db.run('ALTER TABLE events ADD COLUMN custom_images JSON');
          
          // Tentar novamente
          await db.run(
            'UPDATE events SET name = ?, description = ?, message = ?, photos = ?, location = ?, date = ?, custom_images = ? WHERE id = ?',
            [name, description, message, JSON.stringify(photos || []), location, mysqlDate, JSON.stringify(custom_images || []), id]
          );
        } else {
          throw columnError;
        }
      }
      
      res.json({ message: 'Evento atualizado com sucesso!' });
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.run('DELETE FROM events WHERE id = ?', [id]);
      res.json({ message: 'Evento excluído com sucesso!' });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
