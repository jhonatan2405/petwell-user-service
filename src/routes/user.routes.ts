import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { adminOnly, clinicAdminOnly } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// GET /users – ADMIN only (lista de todos los usuarios)
router.get('/', authenticate, adminOnly, userController.listUsers);

// GET /users/profile – any authenticated user
router.get('/profile', authenticate, userController.getProfile);

import multer from 'multer';
const uploadUserPhoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /users/me/photo – any authenticated user
router.post(
    '/me/photo',
    authenticate,
    uploadUserPhoto.single('photo'),
    userController.uploadPhoto,
);

// PUT /users/profile – any authenticated user
router.put(
    '/profile',
    authenticate,
    [
        body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
        body('email').optional().isEmail().withMessage('Se requiere un correo electrónico válido'),
        body('phone').optional().isMobilePhone('any').withMessage('Número de teléfono inválido'),
    ],
    validate,
    userController.updateProfile,
);

// PUT /users/change-password – any authenticated user
router.put(
    '/change-password',
    authenticate,
    [
        body('current_password').notEmpty().withMessage('La contraseña actual es requerida'),
        body('new_password')
            .isLength({ min: 8 })
            .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
    ],
    validate,
    userController.changePassword,
);

// GET /users/by-email?email=... – any authenticated caller (inter-service use)
router.get('/by-email', authenticate, userController.findUserByEmail);

// GET /users/:id – Any authenticated caller (inter-service use)
router.get(
    '/:id',
    authenticate,
    userController.getUserById,
);

// POST /users/veterinarians – CLINIC_ADMIN only
router.post(
    '/veterinarians',
    authenticate,
    clinicAdminOnly,
    [
        body('name').trim().notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Se requiere un correo electrónico válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres'),
        body('license_number').trim().notEmpty().withMessage('El número de licencia es requerido'),
    ],
    validate,
    userController.createVeterinarian,
);

// POST /users/staff – CLINIC_ADMIN only
router.post(
    '/staff',
    authenticate,
    clinicAdminOnly,
    [
        body('name').trim().notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Se requiere un correo electrónico válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres'),
        body('role')
            .isIn(['VETERINARIO', 'RECEPCIONISTA'])
            .withMessage('El rol debe ser VETERINARIO o RECEPCIONISTA'),
        body('license_number').optional().trim(),
    ],
    validate,
    userController.createStaff,
);

// POST /users/receptionists – CLINIC_ADMIN only
router.post(
    '/receptionists',
    authenticate,
    clinicAdminOnly,
    [
        body('name').trim().notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Se requiere un correo electrónico válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres'),
        body('phone').optional().isMobilePhone('any').withMessage('Número de teléfono inválido'),
    ],
    validate,
    userController.createReceptionist,
);

export default router;
