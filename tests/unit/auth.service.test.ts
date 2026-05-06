import { authService } from '../../src/services/auth.service';
import { userRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';
import * as jwtUtil from '../../src/utils/jwt.util';

jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');
jest.mock('../../src/utils/jwt.util');

global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({})
})) as jest.Mock;

describe('Auth Service Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockProfile: any = {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        roles: { role_name: 'Owner' },
        is_verified: true,
        password_hash: 'hashed_password'
    };

    describe('register', () => {
        it('should throw error if email exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            await expect(authService.register({
                name: 'Test', email: 'test@example.com', password: 'password123'
            })).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('should throw error if invalid role_id provided', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.roleExists as jest.Mock).mockResolvedValue(false);
            await expect(authService.register({
                name: 'Test', email: 't@t.com', password: '123', role_id: 999
            })).rejects.toThrow('El role_id proporcionado no es válido');
        });

        it('should register successfully with default role', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.getDefaultRoleId as jest.Mock).mockResolvedValue(1);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue(mockProfile);
            const result = await authService.register({ name: 'T', email: 't@t.com', password: '123' });
            expect(result.user.email).toBe('test@example.com');
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should handle fetch error silently', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (userRepository.getDefaultRoleId as jest.Mock).mockResolvedValue(1);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue(mockProfile);
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
            await expect(authService.register({ name: 'T', email: 't@t.com', password: '123' })).resolves.toBeDefined();
        });
    });

    describe('login', () => {
        it('should login successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwtUtil.generateToken as jest.Mock).mockReturnValue('token');
            const result = await authService.login({ email: 't@t.com', password: '123' });
            expect(result.token).toBe('token');
        });

        it('should throw error if user not verified', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ ...mockProfile, is_verified: false });
            await expect(authService.login({ email: 't', password: '1' })).rejects.toThrow('Cuenta no verificada');
        });

        it('should throw error if password wrong', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(authService.login({ email: 't', password: 'w' })).rejects.toThrow('Credenciales inválidas');
        });
    });

    describe('verifyEmail', () => {
        it('should verify successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockProfile);
            (userRepository.findRawById as jest.Mock).mockResolvedValue({
                id: '1', is_verified: false, verification_code: '123', verification_expires: new Date(Date.now() + 10000)
            });
            (jwtUtil.generateToken as jest.Mock).mockReturnValue('token');
            const result = await authService.verifyEmail({ email: 't', code: '123' });
            expect(result.token).toBe('token');
        });

        it('should throw error if already verified', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ is_verified: true });
            await expect(authService.verifyEmail({ email: 't', code: '1' })).rejects.toThrow('La cuenta ya está verificada');
        });

        it('should throw error if code expired', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({
                id: '1', is_verified: false, verification_code: '1', verification_expires: new Date(Date.now() - 1000)
            });
            await expect(authService.verifyEmail({ email: 't', code: '1' })).rejects.toThrow('El código de verificación ha expirado');
        });
    });

    describe('resendVerificationCode', () => {
        it('should resend successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ id: '1', email: 't@t.com', is_verified: false });
            await authService.resendVerificationCode({ email: 't@t.com' });
            expect(userRepository.updateVerification).toHaveBeenCalled();
        });
    });

    describe('forgotPassword', () => {
        it('should send reset code', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ id: '1', email: 't@t.com' });
            await authService.forgotPassword({ email: 't@t.com' });
            expect(userRepository.updateResetData).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('should reset successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({
                id: '1', reset_code: '123', reset_expires: new Date(Date.now() + 1000)
            });
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            await authService.resetPassword({ email: 't', code: '123', new_password: 'p' });
            expect(userRepository.updatePassword).toHaveBeenCalled();
        });

        it('should throw error if code incorrect', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            (userRepository.findRawById as jest.Mock).mockResolvedValue({ reset_code: '123' });
            await expect(authService.resetPassword({ email: 't', code: 'w', new_password: 'p' })).rejects.toThrow('Código de recuperación incorrecto');
        });
    });
});
