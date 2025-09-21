import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID do evento inválido' });
  }

  try {
    // Buscar convidados do evento
    const guests = await db.all(
      `SELECT id, name, confirmed, num_people, created_at 
       FROM guests 
       WHERE event_id = ? 
       ORDER BY created_at DESC`,
      [id]
    );

    res.status(200).json(guests);
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
