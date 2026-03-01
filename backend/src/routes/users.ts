import { Router } from 'express';
import { body } from 'express-validator';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Validierungsregeln für Benutzer
const userValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'viewer'])
    .withMessage('Rolle muss "admin", "user" oder "viewer" sein')
];

const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
  body('role')
    .isIn(['admin', 'user', 'viewer'])
    .withMessage('Rolle muss "admin", "user" oder "viewer" sein')
];

// Alle Routen erfordern Admin-Rechte
router.get('/', authenticate, requireAdmin, getAllUsers);
router.post('/', authenticate, requireAdmin, createUserValidation, createUser);
router.put('/:id', authenticate, requireAdmin, userValidation, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
