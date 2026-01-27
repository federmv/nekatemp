class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

class DatabaseError extends AppError {
    constructor(message) {
        super(message, 500);
    }
}

module.exports = {
    AppError,
    ValidationError,
    DatabaseError
};
