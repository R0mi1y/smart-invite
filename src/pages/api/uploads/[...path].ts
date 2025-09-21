import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('=== SERVE IMAGE DEBUG ===');
    const { path: imagePath } = req.query;
    console.log('Requested path:', imagePath);
    
    if (!imagePath || !Array.isArray(imagePath)) {
      console.log('Invalid path provided');
      return res.status(400).json({ error: 'Caminho da imagem inválido' });
    }

    const filename = imagePath.join('/');
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    console.log('Filename:', filename);
    console.log('Full file path:', filePath);
    console.log('Uploads directory:', uploadsDir);
    console.log('Uploads dir exists:', fs.existsSync(uploadsDir));
    
    if (fs.existsSync(uploadsDir)) {
      const dirStats = fs.statSync(uploadsDir);
      console.log('Uploads dir permissions:', dirStats.mode.toString(8));
      console.log('Uploads dir UID:', dirStats.uid);
      console.log('Uploads dir GID:', dirStats.gid);
      
      // Listar arquivos no diretório
      try {
        const files = fs.readdirSync(uploadsDir);
        console.log('Files in uploads dir:', files);
      } catch (listError) {
        console.log('Error listing files:', listError);
      }
    }

    // Verificar se o arquivo existe
    console.log('File exists:', fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) {
      console.log('File not found, returning 404');
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // Verificar permissões do arquivo
    const fileStats = fs.statSync(filePath);
    console.log('File size:', fileStats.size);
    console.log('File permissions:', fileStats.mode.toString(8));
    console.log('File UID:', fileStats.uid);
    console.log('File GID:', fileStats.gid);
    console.log('Process UID:', process.getuid?.() || 'N/A');
    console.log('Process GID:', process.getgid?.() || 'N/A');

    // Verificar se o arquivo está dentro do diretório uploads (segurança)
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    console.log('Resolved file path:', resolvedPath);
    console.log('Resolved uploads dir:', resolvedUploadsDir);
    console.log('Path is safe:', resolvedPath.startsWith(resolvedUploadsDir));
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.log('Access denied - path outside uploads dir');
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Determinar o tipo de conteúdo baseado na extensão
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    console.log('Content type:', contentType);

    // Ler e enviar o arquivo
    console.log('Reading file...');
    const fileBuffer = fs.readFileSync(filePath);
    console.log('File read successfully, size:', fileBuffer.length);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    console.log('Sending file...');
    console.log('=== END SERVE IMAGE DEBUG ===');
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('=== SERVE IMAGE ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', (error as Error).stack);
    console.error('=== END SERVE IMAGE ERROR ===');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
