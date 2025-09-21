import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID do convidado inválido' });
  }

  if (req.method === 'DELETE') {
    try {
      // Verificar se o convidado existe
      const existingGuest = await db.get(
        'SELECT id FROM guests WHERE id = ?',
        [id]
      );

      if (!existingGuest) {
        return res.status(404).json({ error: 'Convidado não encontrado' });
      }

      // Deletar o convidado
      await db.run('DELETE FROM guests WHERE id = ?', [id]);

      res.status(200).json({ 
        success: true, 
        message: 'Convite excluído com sucesso!' 
      });
    } catch (error) {
      console.error('Erro ao excluir convidado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
