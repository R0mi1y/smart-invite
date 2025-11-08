import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Garantir que o diretório de upload existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('🔵 API /upload - recebendo arquivo');

  try {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return !!(mimetype && mimetype.includes('image'));
      },
    });

    const [fields, files] = await form.parse(req);
    console.log('🔵 API /upload - arquivo parseado:', Object.keys(files));
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      console.log('🔵 API /upload - ERRO: nenhum arquivo encontrado');
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    console.log('🔵 API /upload - arquivo recebido:', file.originalFilename, file.size, 'bytes');

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalFilename || '');
    const newFileName = `${timestamp}_${randomString}${extension}`;
    const newFilePath = path.join(uploadDir, newFileName);

    // Mover arquivo para o nome final
    fs.renameSync(file.filepath, newFilePath);
    fs.chmodSync(newFilePath, 0o644);

    const fileUrl = `/uploads/${newFileName}`;

    console.log('🔵 API /upload - sucesso! URL:', fileUrl);

    res.json({ 
      url: fileUrl,
      filename: newFileName,
      originalName: file.originalFilename,
      size: file.size
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erro no upload do arquivo' });
  }
}