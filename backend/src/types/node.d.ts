/// <reference types="node" />

declare module 'path' {
    export * from 'node:path';
}

declare module 'fs/promises' {
    export * from 'node:fs/promises';
}

declare module 'url' {
    export * from 'node:url';
}

declare module 'dns' {
    export * from 'node:dns';
}

declare module 'util' {
    export * from 'node:util';
}

declare global {
    var console: Console;
    var process: NodeJS.Process;
    var setTimeout: typeof globalThis.setTimeout;
}

interface ImportMeta {
    url: string;
    dirname?: string;
}