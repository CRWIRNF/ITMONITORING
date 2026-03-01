import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, getCurrentUser } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Validierungsregeln für Login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Passwort muss mindestens 6 Zeichen lang sein')
    .trim()
];

// Validierungsregeln für Registrierung
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Passwort muss Groß- und Kleinbuchstaben sowie Zahlen enthalten')
    .trim(),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Rolle muss entweder "admin" oder "user" sein')
];

router.post('/login', loginValidation, login);
router.post('/register', authenticate, requireAdmin, registerValidation, register);
router.get('/me', authenticate, getCurrentUser);

export default router;
