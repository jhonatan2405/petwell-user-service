import request from 'supertest';
import app from '../../src/server';
import { authService } from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

describe('Auth Controller Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should return 400 for invalid data', async () => {
            const response = await request(app).post('/api/v1/auth/register').send({});
            expect(response.status).toBe(422); // Validation error
        });

        it('should register successfully', async () => {
            (authService.register as jest.Mock).mockResolvedValue({
                message: 'Success',
                user: { id: '1', email: 'test@test.com' }
            });

            const response = await request(app).post('/api/v1/auth/register').send({
                name: 'Test',
                email: 'test@test.com',
                password: 'password123'
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully', async () => {
            (authService.login as jest.Mock).mockResolvedValue({
                token: 'token',
                user: { id: '1', email: 'test@test.com' }
            });

            const response = await request(app).post('/api/v1/auth/login').send({
                email: 'test@test.com',
                password: 'password123'
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBe('token');
        });
    });

    describe('POST /api/v1/auth/verify', () => {
        it('should verify email', async () => {
            (authService.verifyEmail as jest.Mock).mockResolvedValue({ token: 't', user: {} });
            const response = await request(app).post('/api/v1/auth/verify').send({ email: 't@t.com', code: '123' });
            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/v1/auth/resend-code', () => {
        it('should resend verification', async () => {
            (authService.resendVerificationCode as jest.Mock).mockResolvedValue(undefined);
            const response = await request(app).post('/api/v1/auth/resend-code').send({ email: 't@t.com' });
            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/v1/auth/forgot-password', () => {
        it('should trigger forgot password', async () => {
            (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
            const response = await request(app).post('/api/v1/auth/forgot-password').send({ email: 't@t.com' });
            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/v1/auth/reset-password', () => {
        it('should reset password', async () => {
            (authService.resetPassword as jest.Mock).mockResolvedValue(undefined);
            const response = await request(app).post('/api/v1/auth/reset-password').send({ email: 't@t.com', code: '123', new_password: 'password123' });
            expect(response.status).toBe(200);
        });
    });
});
