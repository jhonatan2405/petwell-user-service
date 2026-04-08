import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// POST /users/register
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
        body('role_id').optional().isInt({ min: 1 }).withMessage('role_id must be a positive integer'),
    ],
    validate,
    authController.register,
);

// POST /users/login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    authController.login,
);

export default router;
