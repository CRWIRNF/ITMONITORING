import { Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await UserModel.findAll();
    
    res.json({
      success: true,
      data: result.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }))
    });
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der Benutzer'
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Benutzer mit dieser E-Mail existiert bereits' 
      });
    }

    const user = await UserModel.create(email, password, role || 'user');

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Erstellen des Benutzers'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, password, role } = req.body;

    const user = await UserModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    const updatedUser = await UserModel.update(parseInt(id), { email, password, role });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        created_at: updatedUser.created_at
      }
    });
  } catch (error: any) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren des Benutzers'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verhindere Selbstlöschung
    if (req.user?.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: 'Sie können sich nicht selbst löschen'
      });
    }

    const user = await UserModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    await UserModel.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });
  } catch (error: any) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Löschen des Benutzers'
    });
  }
};
