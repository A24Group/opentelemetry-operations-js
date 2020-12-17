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
const types = require("@opentelemetry/api");
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
const resources_1 = require("@opentelemetry/resources");
const assert = require("assert");
const nock = require("nock");
const sinon = require("sinon");
const protoloader = require("@grpc/proto-loader");
const grpc = require("@grpc/grpc-js");
const google_auth_library_1 = require("google-auth-library");
const src_1 = require("../src");
const gcp_metadata_1 = require("gcp-metadata");
const HEADERS = {
    [gcp_metadata_1.HEADER_NAME.toLowerCase()]: gcp_metadata_1.HEADER_VALUE,
};
const PROJECT_ID_PATH = gcp_metadata_1.BASE_PATH + '/project/project-id';
describe('Google Cloud Trace Exporter', () => {
    beforeEach(() => {
        process.env.GCLOUD_PROJECT = 'not-real';
        nock.disableNetConnect();
    });
    describe('constructor', () => {
        it('should construct an exporter', async () => {
            const exporter = new src_1.TraceExporter({
                credentials: {
                    client_email: 'noreply@fake.example.com',
                    private_key: 'this is a key',
                },
            });
            assert(exporter);
            return exporter['_projectId'].then(id => {
                assert.deepStrictEqual(id, 'not-real');
            });
        });
        it('should construct exporter in GCE/GCP environment without args', async () => {
            // This variable is set by the test env and must be undefined to force
            // a metadata server request.
            delete process.env.GCLOUD_PROJECT;
            const gcpMock = nock(gcp_metadata_1.HOST_ADDRESS)
                .get(PROJECT_ID_PATH)
                .reply(200, () => 'not-real', HEADERS);
            const exporter = new src_1.TraceExporter();
            assert(exporter);
            return exporter['_projectId'].then(id => {
                assert.deepStrictEqual(id, 'not-real');
                gcpMock.done();
            });
        });
    });
    describe('export', () => {
        const mockChannelCreds = {
            compose: sinon.stub(),
        };
        const mockCallCreds = {
            compose: sinon.stub(),
            generateMetadata: sinon.stub(),
        };
        const mockCombinedCreds = {
            compose: sinon.stub(),
        };
        const mockClient = {
            ...google_auth_library_1.OAuth2Client.prototype,
            ...sinon.mock(google_auth_library_1.OAuth2Client),
        };
        let exporter;
        let logger;
        let batchWrite;
        let traceServiceConstructor;
        let createSsl;
        let createFromGoogleCreds;
        let combineChannelCreds;
        let debug;
        let info;
        let warn;
        let error;
        let getClientShouldFail;
        let batchWriteShouldFail;
        beforeEach(() => {
            getClientShouldFail = false;
            batchWriteShouldFail = false;
            logger = new core_1.ConsoleLogger(core_1.LogLevel.ERROR);
            exporter = new src_1.TraceExporter({
                logger,
            });
            batchWrite = sinon.spy((_spans, _metadata, callback) => {
                if (batchWriteShouldFail) {
                    callback(new Error('fail'));
                }
                else {
                    callback(null);
                }
            });
            sinon.replace(exporter['_auth'], 'getClient', async () => {
                if (getClientShouldFail) {
                    throw new Error('fail');
                }
                return mockClient;
            });
            sinon.stub(protoloader, 'loadSync');
            createSsl = sinon
                .stub(grpc.credentials, 'createSsl')
                .returns(mockChannelCreds);
            createFromGoogleCreds = sinon
                .stub(grpc.credentials, 'createFromGoogleCredential')
                .returns(mockCallCreds);
            combineChannelCreds = sinon
                .stub(grpc.credentials, 'combineChannelCredentials')
                .returns(mockCombinedCreds);
            sinon.replaceGetter(grpc, 'loadPackageDefinition', () => () => {
                traceServiceConstructor = sinon.spy(() => { });
                const def = {
                    google: {
                        devtools: {
                            cloudtrace: {
                                v2: {
                                    TraceService: {},
                                },
                            },
                        },
                    },
                };
                // Replace the TraceService with a mock TraceService
                def.google.devtools.cloudtrace.v2.TraceService = class MockTraceService {
                    constructor(host, creds) {
                        this.BatchWriteSpans = batchWrite;
                        traceServiceConstructor(host, creds);
                    }
                };
                return def;
            });
            debug = sinon.spy();
            info = sinon.spy();
            warn = sinon.spy();
            error = sinon.spy();
            sinon.replace(logger, 'debug', debug);
            sinon.replace(logger, 'info', info);
            sinon.replace(logger, 'warn', warn);
            sinon.replace(logger, 'error', error);
        });
        afterEach(() => {
            nock.restore();
            sinon.restore();
        });
        it('should export spans', async () => {
            var _a;
            const readableSpan = {
                attributes: {},
                duration: [32, 800000000],
                startTime: [1566156729, 709],
                endTime: [1566156731, 709],
                ended: true,
                events: [],
                kind: types.SpanKind.CLIENT,
                links: [],
                name: 'my-span',
                spanContext: {
                    traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                    spanId: '6e0c63257de34c92',
                    traceFlags: api_1.TraceFlags.NONE,
                    isRemote: true,
                },
                status: { code: types.StatusCode.OK },
                resource: resources_1.Resource.empty(),
                instrumentationLibrary: { name: 'default', version: '0.0.1' },
            };
            const result = await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            assert.deepStrictEqual((_a = batchWrite.getCall(0).args[0].spans[0].displayName) === null || _a === void 0 ? void 0 : _a.value, 'my-span');
            assert(createSsl.calledOnceWithExactly());
            assert(createFromGoogleCreds.calledOnceWithExactly(mockClient));
            assert(combineChannelCreds.calledOnceWithExactly(mockChannelCreds, mockCallCreds));
            assert(traceServiceConstructor.calledOnceWithExactly('cloudtrace.googleapis.com:443', mockCombinedCreds));
            assert.strictEqual(result.code, core_1.ExportResultCode.SUCCESS);
        });
        it('should memoize the rpc client', async () => {
            const readableSpan = {
                attributes: {},
                duration: [32, 800000000],
                startTime: [1566156729, 709],
                endTime: [1566156731, 709],
                ended: true,
                events: [],
                kind: types.SpanKind.CLIENT,
                links: [],
                name: 'my-span',
                spanContext: {
                    traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                    spanId: '6e0c63257de34c92',
                    traceFlags: api_1.TraceFlags.NONE,
                    isRemote: true,
                },
                status: { code: types.StatusCode.OK },
                resource: resources_1.Resource.empty(),
                instrumentationLibrary: { name: 'default', version: '0.0.1' },
            };
            await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            assert(createSsl.calledOnce);
            assert(createFromGoogleCreds.calledOnce);
            assert(combineChannelCreds.calledOnce);
            assert(traceServiceConstructor.calledOnce);
        });
        it('should return FAILED if authorization fails', async () => {
            const readableSpan = {
                attributes: {},
                duration: [32, 800000000],
                startTime: [1566156729, 709],
                endTime: [1566156731, 709],
                ended: true,
                events: [],
                kind: types.SpanKind.CLIENT,
                links: [],
                name: 'my-span',
                spanContext: {
                    traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                    spanId: '6e0c63257de34c92',
                    traceFlags: api_1.TraceFlags.NONE,
                    isRemote: true,
                },
                status: { code: types.StatusCode.OK },
                resource: resources_1.Resource.empty(),
                instrumentationLibrary: { name: 'default', version: '0.0.1' },
            };
            getClientShouldFail = true;
            const result = await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            assert(error.getCall(0).args[0].match(/failed to create client: fail/));
            assert(traceServiceConstructor.calledOnce);
            assert.strictEqual(result.code, core_1.ExportResultCode.FAILED);
        });
        it('should return FAILED if span writing fails', async () => {
            const readableSpan = {
                attributes: {},
                duration: [32, 800000000],
                startTime: [1566156729, 709],
                endTime: [1566156731, 709],
                ended: true,
                events: [],
                kind: types.SpanKind.CLIENT,
                links: [],
                name: 'my-span',
                spanContext: {
                    traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                    spanId: '6e0c63257de34c92',
                    traceFlags: api_1.TraceFlags.NONE,
                    isRemote: true,
                },
                status: { code: types.StatusCode.OK },
                resource: resources_1.Resource.empty(),
                instrumentationLibrary: { name: 'default', version: '0.0.1' },
            };
            batchWriteShouldFail = true;
            const result = await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            assert.strictEqual(result.code, core_1.ExportResultCode.FAILED);
        });
        it('should return FAILED if project id missing', async () => {
            const readableSpan = {
                attributes: {},
                duration: [32, 800000000],
                startTime: [1566156729, 709],
                endTime: [1566156731, 709],
                ended: true,
                events: [],
                kind: types.SpanKind.CLIENT,
                links: [],
                name: 'my-span',
                spanContext: {
                    traceId: 'd4cda95b652f4a1592b449d5929fda1b',
                    spanId: '6e0c63257de34c92',
                    traceFlags: api_1.TraceFlags.NONE,
                    isRemote: true,
                },
                status: { code: types.StatusCode.OK },
                resource: resources_1.Resource.empty(),
                instrumentationLibrary: { name: 'default', version: '0.0.1' },
            };
            await exporter['_projectId'];
            exporter['_projectId'] = undefined;
            const result = await new Promise(resolve => {
                exporter.export([readableSpan], result => {
                    resolve(result);
                });
            });
            assert.strictEqual(result.code, core_1.ExportResultCode.FAILED);
        });
    });
});
//# sourceMappingURL=exporter.test.js.map