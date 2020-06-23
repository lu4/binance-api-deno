// export type ErrorEx = Error & ({ code?: string, url?: string } | { response?: Response, responseText?: string });

export class ApiError extends Error {
    public constructor(
        public readonly json: any,
        public readonly code: string,
        public readonly message: string,
        
        public readonly response: Response,
        public readonly responseText: string
    ) {
        super(message);
    }
}

export class ProxyError extends Error {
    public constructor(
        public readonly response: Response,
        public readonly responseText: string

    ) {
        super(responseText);
    }
}
