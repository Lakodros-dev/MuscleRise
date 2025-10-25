import { MongoClientOptions as OriginalMongoClientOptions } from 'mongodb';

declare module 'mongodb' {
    interface MongoClientOptions extends Partial<OriginalMongoClientOptions> {
        tls?: boolean;
        tlsAllowInvalidCertificates?: boolean;
        tlsAllowInvalidHostnames?: boolean;
        connectTimeoutMS?: number;
        serverSelectionTimeoutMS?: number;
        [key: string]: any;
    }
}