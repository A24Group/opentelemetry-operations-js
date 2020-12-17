"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceExporter = void 0;
const core_1 = require("@opentelemetry/core");
const protoloader = require("@grpc/proto-loader");
const protofiles = require("google-proto-files");
const grpc = require("@grpc/grpc-js");
const google_auth_library_1 = require("google-auth-library");
const util_1 = require("util");
const transform_1 = require("./transform");
const OT_REQUEST_HEADER = 'x-opentelemetry-outgoing-request';
/**
 * Format and sends span information to Google Cloud Trace.
 */
class TraceExporter {
    constructor(options = {}) {
        this._traceServiceClient = undefined;
        this._logger = options.logger || new core_1.NoopLogger();
        this._auth = new google_auth_library_1.GoogleAuth({
            credentials: options.credentials,
            keyFile: options.keyFile,
            keyFilename: options.keyFilename,
            projectId: options.projectId,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        // Start this async process as early as possible. It will be
        // awaited on the first export because constructors are synchronous
        this._projectId = this._auth.getProjectId().catch(err => {
            this._logger.error(err);
        });
    }
    /**
     * Publishes a list of spans to Google Cloud Trace.
     * @param spans The list of spans to transmit to Google Cloud Trace
     */
    async export(spans, resultCallback) {
        if (this._projectId instanceof Promise) {
            this._projectId = await this._projectId;
        }
        if (!this._projectId) {
            return resultCallback({
                code: core_1.ExportResultCode.FAILED,
                error: new Error('Was not able to determine GCP project ID'),
            });
        }
        this._logger.debug('Google Cloud Trace export');
        const namedSpans = {
            name: `projects/${this._projectId}`,
            spans: spans.map(transform_1.getReadableSpanTransformer(this._projectId)),
        };
        const result = await this._batchWriteSpans(namedSpans);
        resultCallback(result);
    }
    async shutdown() { }
    /**
     * Sends new spans to new or existing traces in the Google Cloud Trace format to the
     * service.
     * @param spans
     */
    async _batchWriteSpans(spans) {
        this._logger.debug('Google Cloud Trace batch writing traces');
        try {
            this._traceServiceClient = await this._getClient();
        }
        catch (error) {
            error.message = `failed to create client: ${error.message}`;
            this._logger.error(error.message);
            return { code: core_1.ExportResultCode.FAILED, error };
        }
        const metadata = new grpc.Metadata();
        metadata.add(OT_REQUEST_HEADER, '1');
        const batchWriteSpans = util_1.promisify(this._traceServiceClient.BatchWriteSpans).bind(this._traceServiceClient);
        try {
            await batchWriteSpans(spans, metadata);
            this._logger.debug('batchWriteSpans successfully');
            return { code: core_1.ExportResultCode.SUCCESS };
        }
        catch (error) {
            error.message = `batchWriteSpans error: ${error.message}`;
            this._logger.error(error.message);
            return { code: core_1.ExportResultCode.FAILED, error };
        }
    }
    /**
     * If the rpc client is not already initialized,
     * authenticates with google credentials and initializes the rpc client
     */
    async _getClient() {
        if (this._traceServiceClient) {
            return this._traceServiceClient;
        }
        this._logger.debug('Google Cloud Trace authenticating');
        const creds = await this._auth.getClient();
        this._logger.debug('Google Cloud Trace got authentication. Initializaing rpc client');
        const packageDefinition = await protoloader.load(protofiles.getProtoPath('devtools', 'cloudtrace', 'v2', 'tracing.proto'), {
            includeDirs: [protofiles.getProtoPath('..')],
            longs: String,
            defaults: true,
            oneofs: true,
        });
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const { google } = grpc.loadPackageDefinition(packageDefinition);
        const traceService = google.devtools.cloudtrace.v2.TraceService;
        const sslCreds = grpc.credentials.createSsl();
        const callCreds = grpc.credentials.createFromGoogleCredential(creds);
        return new traceService('cloudtrace.googleapis.com:443', grpc.credentials.combineChannelCredentials(sslCreds, callCreds));
    }
}
exports.TraceExporter = TraceExporter;
//# sourceMappingURL=trace.js.map