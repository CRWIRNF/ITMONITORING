import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const versionPath = path.join(__dirname, '../../../VERSION.json');
    const versionData = fs.readFileSync(versionPath, 'utf-8');
    const version = JSON.parse(versionData);

    res.json({
      success: true,
      data: version
    });
  } catch (error: any) {
    console.error('Fehler beim Laden der Versionsinformationen:', error);
    res.status(500).json({
      success: false,
      error: 'Versionsinformationen konnten nicht geladen werden'
    });
  }
});

export default router;
