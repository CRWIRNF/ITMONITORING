import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { LoginHistoryModel } from '../models/LoginHistory';

export const login = async (req: Request, res: Response) => {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Log fehlgeschlagenen Login-Versuch
      try {
        await LoginHistoryModel.logLogin(0, email, ipAddress, userAgent, false);
      } catch (logError) {
        console.error('Fehler beim Loggen des fehlgeschlagenen Login-Versuchs:', logError);
      }
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const isValid = await UserModel.verifyPassword(password, user.password);
    if (!isValid) {
      // Log fehlgeschlagenen Login-Versuch
      try {
        await LoginHistoryModel.logLogin(user.id, email, ipAddress, userAgent, false);
      } catch (logError) {
        console.error('Fehler beim Loggen des fehlgeschlagenen Login-Versuchs:', logError);
      }
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Log erfolgreichen Login
    try {
      await LoginHistoryModel.logLogin(user.id, email, ipAddress, userAgent, true);
    } catch (logError) {
      console.error('Fehler beim Loggen des erfolgreichen Logins:', logError);
    }

    const jwtSecret = process.env.JWT_SECRET || 'monitoring_jwt_secret_key_change_this_in_production_123456789';

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    // Generische Fehlermeldung für Sicherheit
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email bereits registriert' });
    }

    const user = await UserModel.create(email, password, role || 'user');

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registrierungs-Fehler:', error);
    // Generische Fehlermeldung für Sicherheit
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Users:', error);
    // Generische Fehlermeldung für Sicherheit
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
  }
};
