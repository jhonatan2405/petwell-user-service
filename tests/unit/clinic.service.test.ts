import { clinicService } from '../../src/services/clinic.service';
import { clinicRepository } from '../../src/repositories/clinic.repository';
import { userRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';

jest.mock('../../src/repositories/clinic.repository', () => {
    const original = jest.requireActual('../../src/repositories/clinic.repository');
    return {
        ...original,
        clinicRepository: {
            findById: jest.fn(),
            update: jest.fn(),
            findStaffByClinicId: jest.fn(),
            findByTaxId: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            uploadLogo: jest.fn(),
            updateLogoUrl: jest.fn(),
        }
    };
});
jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');

describe('Clinic Service Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockClinic = {
        id: 'clinic-1',
        name: 'Test Clinic',
        email: 'clinic@test.com',
        phone: '123456789',
        address: '123 Main St',
        logo_url: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    };

    describe('registerClinic', () => {
        const dto = {
            clinic_name: 'Test', address: '123', city: 'City', phone: '123', tax_id: '123',
            admin_name: 'Admin', email: 'admin@test.com', password: 'pass'
        };

        it('should throw error if email exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
            await expect(clinicService.registerClinic(dto)).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('should throw error if tax id exists', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (clinicRepository.findByTaxId as jest.Mock).mockResolvedValue({ id: '1' });
            await expect(clinicService.registerClinic(dto)).rejects.toThrow('Ya existe una clínica registrada con ese RUC / NIT');
        });

        it('should register clinic successfully', async () => {
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (clinicRepository.findByTaxId as jest.Mock).mockResolvedValue(null);
            (clinicRepository.create as jest.Mock).mockResolvedValue(mockClinic);
            (userRepository.getRoleIdByName as jest.Mock).mockResolvedValue(1);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'admin@test.com' });

            const result = await clinicService.registerClinic(dto);
            expect(result.clinic.id).toBe('clinic-1');
            expect(result.token).toBeDefined();
        });

        it('should handle optional fields as null', async () => {
            const dtoMinimal = { ...dto, opening_hours: undefined, specialties: undefined, phone: '123' };
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (clinicRepository.findByTaxId as jest.Mock).mockResolvedValue(null);
            (clinicRepository.create as jest.Mock).mockResolvedValue(mockClinic);
            (userRepository.getRoleIdByName as jest.Mock).mockResolvedValue(1);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
            (userRepository.create as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'admin@test.com' });

            await clinicService.registerClinic(dtoMinimal as any);
            expect(clinicRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                opening_hours: null,
                specialties: null
            }));
        });
    });

    describe('getClinic', () => {
        it('should return clinic successfully', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(mockClinic);

            const result = await clinicService.getClinic('clinic-1');

            expect(result).toBeDefined();
            expect(result.id).toBe('clinic-1');
        });

        it('should throw error if clinic not found', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(clinicService.getClinic('bad-id')).rejects.toThrow('Clínica no encontrada');
        });
    });

    describe('getClinicStaff', () => {
        it('should throw error if clinic not found', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(clinicService.getClinicStaff('bad-id')).rejects.toThrow('Clínica no encontrada');
        });

        it('should return staff successfully', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(mockClinic);
            (clinicRepository.findStaffByClinicId as jest.Mock).mockResolvedValue([{ id: 'staff-1' }]);

            const result = await clinicService.getClinicStaff('clinic-1');

            expect(result.length).toBe(1);
            expect(clinicRepository.findStaffByClinicId).toHaveBeenCalledWith('clinic-1');
        });
    });

    describe('getAllClinics', () => {
        it('should return all clinics', async () => {
            (clinicRepository.findAll as jest.Mock).mockResolvedValue([mockClinic]);
            const result = await clinicService.getAllClinics();
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('clinic-1');
        });
    });
    
    describe('uploadLogo', () => {
        it('should throw error if clinic not found', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(clinicService.uploadLogo('bad', Buffer.from(''), 'image/png')).rejects.toThrow('Clínica no encontrada');
        });

        it('should upload logo successfully', async () => {
            (clinicRepository.findById as jest.Mock).mockResolvedValue(mockClinic);
            (clinicRepository.uploadLogo as jest.Mock).mockResolvedValue('url');
            
            const result = await clinicService.uploadLogo('clinic-1', Buffer.from(''), 'image/png');
            expect(result).toBe('url');
            expect(clinicRepository.updateLogoUrl).toHaveBeenCalledWith('clinic-1', 'url');
        });
    });
});
