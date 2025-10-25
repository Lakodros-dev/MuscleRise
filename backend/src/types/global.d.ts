declare global {
    var console: Console;
    var process: NodeJS.Process;
    var setTimeout: typeof globalThis.setTimeout;
}

declare module 'path' {
    export function join(...paths: string[]): string;
    export function resolve(...paths: string[]): string;
    export function dirname(path: string): string;
    export function basename(path: string, ext?: string): string;
    export function extname(path: string): string;
    export const sep: string;
}

declare module 'fs/promises' {
    export function readFile(path: string, encoding?: string): Promise<string | Buffer>;
    export function writeFile(path: string, data: string | Buffer): Promise<void>;
    export function mkdir(path: string, options?: any): Promise<void>;
    export function readdir(path: string): Promise<string[]>;
    export function stat(path: string): Promise<any>;
    export function access(path: string): Promise<void>;
}

declare module 'url' {
    export function fileURLToPath(url: string): string;
    export function pathToFileURL(path: string): URL;
}

declare module 'dns' {
    export function lookup(hostname: string, callback: (err: any, address: string, family: number) => void): void;
    export function resolve(hostname: string, callback: (err: any, addresses: string[]) => void): void;
}

declare module 'util' {
    export function promisify<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => Promise<any>;
}

declare module '@shared/api' {
    export const API_BASE_URL: string;
    export const API_ENDPOINTS: any;
}

// MongoDB types
declare module 'mongodb' {
    export interface MongoClientOptions {
        tls?: boolean;
        tlsAllowInvalidCertificates?: boolean;
        tlsAllowInvalidHostnames?: boolean;
        connectTimeoutMS?: number;
        serverSelectionTimeoutMS?: number;
        [key: string]: any;
    }
}

interface ImportMeta {
    url: string;
    dirname?: string;
}

export { };