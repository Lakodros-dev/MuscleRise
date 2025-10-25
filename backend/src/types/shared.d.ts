declare module '@shared/api' {
    export const API_BASE_URL: string;
    export const API_ENDPOINTS: {
        [key: string]: string;
    };
    export interface DemoResponse {
        message: string;
        data?: any;
    }
}