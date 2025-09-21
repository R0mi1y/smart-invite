import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('=== UPLOAD DEBUG ===');
    console.log('Upload directory:', uploadDir);
    console.log('Directory exists:', fs.existsSync(uploadDir));
    
    if (fs.existsSync(uploadDir)) {
      const stats = fs.statSync(uploadDir);
      console.log('Directory permissions:', stats.mode.toString(8));
      console.log('Directory owner UID:', stats.uid);
      console.log('Directory owner GID:', stats.gid);
    }
    
    console.log('Process UID:', process.getuid?.() || 'N/A');
    console.log('Process GID:', process.getgid?.() || 'N/A');
    
    await runMiddleware(req, res, upload.array('images', 10));
    
    const files = (req as any).files;
    console.log('Files received:', files?.length || 0);
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    // Verificar cada arquivo salvo
    files.forEach((file: any, index: number) => {
      const filePath = path.join(uploadDir, file.filename);
      console.log(`File ${index + 1}:`);
      console.log('  - Filename:', file.filename);
      console.log('  - Path:', filePath);
      console.log('  - Exists:', fs.existsSync(filePath));
      
      if (fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath);
        console.log('  - Size:', fileStats.size, 'bytes');
        console.log('  - Permissions:', fileStats.mode.toString(8));
        console.log('  - Owner UID:', fileStats.uid);
        console.log('  - Owner GID:', fileStats.gid);
      }
    });

    const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';
    const imageUrls = files.map((file: any) => `${assetPrefix}/api/uploads/${file.filename}`);
    
    console.log('Generated URLs:', imageUrls);
    console.log('=== END UPLOAD DEBUG ===');

    res.status(200).json({ 
      success: true, 
      images: imageUrls,
      message: `${files.length} imagem(ns) enviada(s) com sucesso!`
    });
  } catch (error: any) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('=== END UPLOAD ERROR ===');
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}
