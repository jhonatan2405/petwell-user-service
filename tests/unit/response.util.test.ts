import { sendSuccess, sendError } from '../../src/utils/response.util';
import { Response } from 'express';

// Mock Express Response
const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockRes = { status: mockStatus } as unknown as Response;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('response.util', () => {
    describe('sendSuccess', () => {
        it('should send a successful response with custom data, message, and statusCode', () => {
            const data = { id: 1, name: 'Test' };
            sendSuccess(mockRes, data, 'Created', 201);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'Created',
                data,
            });
        });

        it('should use default message "OK" and statusCode 200 when not provided', () => {
            const data = { id: 2 };
            sendSuccess(mockRes, data);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'OK',
                data,
            });
        });

        it('should handle null data', () => {
            sendSuccess(mockRes, null, 'No content', 204);

            expect(mockStatus).toHaveBeenCalledWith(204);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: 'No content',
                data: null,
            });
        });
    });

    describe('sendError', () => {
        it('should send an error response with custom message, statusCode and errors', () => {
            const errors = [{ field: 'email', msg: 'Invalid' }];
            sendError(mockRes, 'Validation failed', 422, errors);

            expect(mockStatus).toHaveBeenCalledWith(422);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors,
            });
        });

        it('should use default statusCode 500 when not provided', () => {
            sendError(mockRes, 'Internal error');

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: 'Internal error',
                errors: undefined,
            });
        });

        it('should send error without errors field when not provided', () => {
            sendError(mockRes, 'Not found', 404);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: 'Not found',
                errors: undefined,
            });
        });
    });
});
