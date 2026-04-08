import { Router } from 'express';
import { body } from 'express-validator';
import { clinicController } from '../controllers/clinic.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.model';

const router = Router();
import multer from 'multer';

const uploadClinicLogo = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /clinics/register — Público
router.post(
    '/register',
    [
        body('clinic_name').trim().notEmpty().withMessage('El nombre de la clínica es requerido'),
        body('admin_name').trim().notEmpty().withMessage('El nombre del administrador es requerido'),
        body('email').isEmail().withMessage('Se requiere un correo electrónico válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres'),
        body('phone').trim().notEmpty().withMessage('El teléfono es requerido'),
        body('address').trim().notEmpty().withMessage('La dirección es requerida'),
        body('city').trim().notEmpty().withMessage('La ciudad es requerida'),
        body('tax_id').trim().notEmpty().withMessage('El RUC / NIT es requerido'),
    ],
    validate,
    clinicController.register,
);

// GET /clinics — lista todas las clínicas (requiere JWT)
router.get(
    '/',
    authenticate,
    clinicController.getClinics,
);

// GET /clinics/:id — ADMIN | CLINIC_ADMIN | VETERINARIO | RECEPCIONISTA | DUENO_MASCOTA
router.get(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.VETERINARIO, UserRole.RECEPCIONISTA, UserRole.DUENO_MASCOTA),
    clinicController.getClinic,
);

// GET /clinics/:id/staff — ADMIN | CLINIC_ADMIN | VETERINARIO (needed to select vet on EHR creation)
router.get(
    '/:id/staff',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.CLINIC_ADMIN, UserRole.VETERINARIO),
    clinicController.getClinicStaff,
);

// POST /clinics/:id/logo — CLINIC_ADMIN
router.post(
    '/:id/logo',
    authenticate,
    authorize(UserRole.CLINIC_ADMIN),
    uploadClinicLogo.single('logo'),
    clinicController.uploadLogo,
);

export default router;

