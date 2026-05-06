import request from 'supertest';
import app from '../../src/server';
import { userRepository } from '../../src/repositories/user.repository';
import jwt from 'jsonwebtoken';

jest.mock('../../src/repositories/user.repository');

describe('User Controller Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const generateToken = (payload: any) => {
        return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    };

    const mockUserPayload = {
        userId: 'user-1',
        email: 'test@example.com',
        role: 'Owner',
        clinicId: 'clinic-1'
    };

    const validToken = generateToken(mockUserPayload);

    describe('GET /api/v1/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/v1/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
        });
    });

    describe('GET /api/v1/users/profile', () => {
        it('should return 401 if no token provided', async () => {
            const response = await request(app).get('/api/v1/users/profile');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Cabecera de autorización faltante o incorrecta');
        });

        it('should return profile successfully', async () => {
            const mockProfile = {
                id: 'user-1',
                name: 'Test',
                email: 'test@example.com',
                phone: '123',
                roles: { role_name: 'Owner' },
                is_active: true,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            };
            (userRepository.findById as jest.Mock).mockResolvedValue(mockProfile);

            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', 'user-1');
        });

        it('should handle repository errors gracefully', async () => {
            (userRepository.findById as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

            const response = await request(app)
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBeDefined();
        });
    });

    describe('PUT /api/v1/users/profile', () => {
        it('should validate inputs before updating', async () => {
            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ email: 'invalid-email' }); // Missing required fields or invalid

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should update profile successfully', async () => {
            const mockUpdated = {
                id: 'user-1',
                name: 'New Name',
                email: 'test@example.com',
                roles: { role_name: 'Owner' },
            };
            (userRepository.findById as jest.Mock).mockResolvedValue({ id: 'user-1' });
            (userRepository.update as jest.Mock).mockResolvedValue(mockUpdated);

            const response = await request(app)
                .put('/api/v1/users/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'New Name' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('New Name');
        });
    });

    describe('GET /api/v1/users', () => {
        it('should return 403 if not admin', async () => {
            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${validToken}`); // Owner role
            
            // Should be 403 because it needs ADMIN role
            expect(response.status).toBe(403);
        });

        it('should list users if admin', async () => {
            const adminToken = generateToken({ ...mockUserPayload, role: 'ADMIN' });
            const { userService } = require('../../src/services/user.service');
            jest.spyOn(userService, 'listAllUsers').mockResolvedValue([]);

            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('should get user by id', async () => {
            const { userService } = require('../../src/services/user.service');
            jest.spyOn(userService, 'getUserById').mockResolvedValue({ id: '1' } as any);

            const response = await request(app)
                .get('/api/v1/users/1')
                .set('Authorization', `Bearer ${validToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe('user-1');
        });
    });

    describe('GET /api/v1/users/by-email', () => {
        it('should get user by email', async () => {
            const { userService } = require('../../src/services/user.service');
            jest.spyOn(userService, 'findUserByEmail').mockResolvedValue({ id: '1', email: 'test@test.com' } as any);

            const response = await request(app)
                .get('/api/v1/users/by-email?email=test@test.com')
                .set('Authorization', `Bearer ${validToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe('1');
        });

        it('should throw 400 if no email param', async () => {
            const response = await request(app)
                .get('/api/v1/users/by-email')
                .set('Authorization', `Bearer ${validToken}`);
            
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/users/staff', () => {
        it('should create staff if CLINIC_ADMIN', async () => {
            const adminToken = generateToken({ ...mockUserPayload, role: 'CLINIC_ADMIN', clinic_id: '1' });
            const { staffService } = require('../../src/services/staff.service');
            jest.spyOn(staffService, 'createStaff').mockResolvedValue({ id: '2', role: 'VETERINARIO' } as any);

            const response = await request(app)
                .post('/api/v1/users/staff')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test', email: 't@t.com', password: 'password123', role: 'VETERINARIO'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.data.role).toBe('VETERINARIO');
        });

        it('should return 400 if CLINIC_ADMIN has no clinic_id', async () => {
            const adminToken = generateToken({ ...mockUserPayload, role: 'CLINIC_ADMIN', clinic_id: null });
            const response = await request(app)
                .post('/api/v1/users/staff')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test', email: 't@t.com', password: 'password123', role: 'VETERINARIO'
                });
            
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/users/me/photo', () => {
        it('should upload photo', async () => {
            const { userService } = require('../../src/services/user.service');
            jest.spyOn(userService, 'uploadPhoto').mockResolvedValue('url');
            const response = await request(app)
                .post('/api/v1/users/me/photo')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('photo', Buffer.from('test'), 'test.png');
            expect(response.status).toBe(200);
            expect(response.body.data.photo_url).toBe('url');
        });

        it('should return 400 if no file', async () => {
            const response = await request(app)
                .post('/api/v1/users/me/photo')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/users/veterinarians', () => {
        it('should create veterinarian', async () => {
            const { staffService } = require('../../src/services/staff.service');
            jest.spyOn(staffService, 'createVeterinarian').mockResolvedValue({ id: '1' } as any);
            const response = await request(app)
                .post('/api/v1/users/veterinarians')
                .set('Authorization', `Bearer ${generateToken({ sub: '1', role: 'CLINIC_ADMIN', clinic_id: 'c1' })}`)
                .send({ name: 'Vet', email: 'v@v.com', password: 'password', license_number: '123' });
            expect(response.status).toBe(201);
        });

        it('should return 400 if no clinic_id', async () => {
            const response = await request(app)
                .post('/api/v1/users/veterinarians')
                .set('Authorization', `Bearer ${generateToken({ sub: '1', role: 'CLINIC_ADMIN' })}`)
                .send({ name: 'Vet', email: 'v@v.com', password: 'password123', license_number: '123' });
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/users/receptionists', () => {
        it('should create receptionist', async () => {
            const { staffService } = require('../../src/services/staff.service');
            jest.spyOn(staffService, 'createReceptionist').mockResolvedValue({ id: '1' } as any);
            const response = await request(app)
                .post('/api/v1/users/receptionists')
                .set('Authorization', `Bearer ${generateToken({ sub: '1', role: 'CLINIC_ADMIN', clinic_id: 'c1' })}`)
                .send({ name: 'Rec', email: 'r@r.com', password: 'password' });
            expect(response.status).toBe(201);
        });
    });

    describe('PUT /api/v1/users/change-password', () => {
        it('should change password', async () => {
            const { userService } = require('../../src/services/user.service');
            jest.spyOn(userService, 'changePassword').mockResolvedValue(undefined);

            const response = await request(app)
                .put('/api/v1/users/change-password')
                .set('Authorization', `Bearer ${validToken}`)
                .send({
                    current_password: 'pass', new_password: 'new_password123'
                });
            
            expect(response.status).toBe(200);
        });
    });
});
