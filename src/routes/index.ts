import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clinicRoutes from './clinic.routes';

const router = Router();

// Health check – used by API Gateway and load balancers
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clinics', clinicRoutes);

export default router;
