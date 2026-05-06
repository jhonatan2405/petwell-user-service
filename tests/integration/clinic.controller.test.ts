import request from 'supertest';
import app from '../../src/server';
import { clinicService } from '../../src/services/clinic.service';
import jwt from 'jsonwebtoken';

jest.mock('../../src/services/clinic.service');

describe('Clinic Controller Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const generateToken = (payload: any) => {
        return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    };

    const validPayload = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'CLINIC_ADMIN',
    };
    const validToken = generateToken(validPayload);

    describe('GET /api/v1/clinics/:id', () => {
        it('should get clinic successfully', async () => {
            (clinicService.getClinic as jest.Mock).mockResolvedValue({ id: 'clinic-1', name: 'Test' });

            const response = await request(app)
                .get('/api/v1/clinics/clinic-1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Test');
        });
    });

    describe('GET /api/v1/clinics/:id/staff', () => {
        it('should get staff successfully', async () => {
            (clinicService.getClinicStaff as jest.Mock).mockResolvedValue([{ id: 'staff-1', name: 'Staff' }]);

            const response = await request(app)
                .get('/api/v1/clinics/clinic-1/staff')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.staff.length).toBe(1);
        });
    });

    describe('GET /api/v1/clinics', () => {
        it('should get all clinics', async () => {
            (clinicService.getAllClinics as jest.Mock).mockResolvedValue([{ id: 'clinic-1', name: 'Test' }]);

            const response = await request(app)
                .get('/api/v1/clinics')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.clinics.length).toBe(1);
        });
    });

    describe('POST /api/v1/clinics/register', () => {
        it('should register clinic', async () => {
            (clinicService.registerClinic as jest.Mock).mockResolvedValue({ clinic: { id: '1' }, token: 'token' });

            const response = await request(app).post('/api/v1/clinics/register').send({
                clinic_name: 'Test', address: '123', city: 'City', phone: '123', tax_id: '123',
                admin_name: 'Admin', email: 'a@a.com', password: 'password123'
            });
            expect(response.status).toBe(201);
            expect(response.body.data.token).toBe('token');
        });
    });

    describe('POST /api/v1/clinics/:id/logo', () => {
        it('should upload logo', async () => {
            const adminToken = generateToken({ ...validPayload, clinic_id: 'clinic-1' });
            (clinicService.uploadLogo as jest.Mock).mockResolvedValue('url');

            const response = await request(app)
                .post('/api/v1/clinics/clinic-1/logo')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('logo', Buffer.from('test'), 'test.png'); // multer handles 'logo'
            
            expect(response.status).toBe(200);
            expect(response.body.data.logo_url).toBe('url');
        });

        it('should return 403 if not correct clinic_id', async () => {
            const adminToken = generateToken({ ...validPayload, clinic_id: 'clinic-2' });
            const response = await request(app)
                .post('/api/v1/clinics/clinic-1/logo')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('logo', Buffer.from('test'), 'test.png');
            
            expect(response.status).toBe(403);
        });

        it('should return 400 if no file', async () => {
            const adminToken = generateToken({ ...validPayload, clinic_id: 'clinic-1' });
            const response = await request(app)
                .post('/api/v1/clinics/clinic-1/logo')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(response.status).toBe(400);
        });
    });
});
