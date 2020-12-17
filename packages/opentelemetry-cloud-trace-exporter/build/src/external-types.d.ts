import { Logger } from '@opentelemetry/api';
export interface TraceExporterOptions {
    /**
     * Google Cloud Platform project ID where your traces will be stored.
     * This is optional and will be inferred from your authentication
     * credentials or from the GCP environment when not specified.
     */
    projectId?: string;
    /**
     * Object implementing the logger interface
     */
    logger?: Logger;
    /**
     * Path to a .json, .pem, or .p12 key file. This is optional and
     * authentication keys will be inferred from the environment if you
     * are running on GCP.
     */
    keyFilename?: string;
    /**
     * Path to a .json, .pem, or .p12 key file. This is optional and
     * authentication keys will be inferred from the environment if you
     * are running on GCP.
     */
    keyFile?: string;
    /**
     * Object containing client_email and private_key properties
     */
    credentials?: Credentials;
}
export interface Credentials {
    client_email?: string;
    private_key?: string;
}
