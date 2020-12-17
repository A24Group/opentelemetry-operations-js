"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const types = require("@opentelemetry/api");
const api_1 = require("@opentelemetry/api");
const core_1 = require("@opentelemetry/core");
const resources_1 = require("@opentelemetry/resources");
const assert = require("assert");
const transform_1 = require("../src/transform");
const types_1 = require("../src/types");
const version_1 = require("../src/version");
describe('transform', () => {
    let readableSpan;
    let transformer;
    let spanContext;
    beforeEach(() => {
        spanContext = {
            traceId: 'd4cda95b652f4a1592b449d5929fda1b',
            spanId: '6e0c63257de34c92',
            traceFlags: api_1.TraceFlags.NONE,
            isRemote: true,
        };
        transformer = transform_1.getReadableSpanTransformer('project-id');
        readableSpan = {
            attributes: {},
            duration: [32, 800000000],
            startTime: [1566156729, 709],
            endTime: [1566156731, 709],
            ended: true,
            events: [],
            kind: types.SpanKind.CLIENT,
            links: [],
            name: 'my-span',
            spanContext,
            status: { code: types.StatusCode.OK },
            resource: new resources_1.Resource({
                service: 'ui',
                version: 1,
                cost: 112.12,
            }),
            instrumentationLibrary: { name: 'default', version: '0.0.1' },
        };
    });
    it('should transform spans', () => {
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result, {
            attributes: {
                attributeMap: {
                    project_id: { stringValue: { value: 'project-id' } },
                    'g.co/agent': {
                        stringValue: {
                            value: `opentelemetry-js ${core_1.VERSION}; google-cloud-trace-exporter ${version_1.VERSION}`,
                        },
                    },
                    cost: { intValue: '112' },
                    service: { stringValue: { value: 'ui' } },
                    version: { intValue: '1' },
                },
                droppedAttributesCount: 0,
            },
            displayName: { value: 'my-span' },
            links: { link: [] },
            endTime: { seconds: 1566156731, nanos: 709 },
            startTime: { seconds: 1566156729, nanos: 709 },
            name: 'projects/project-id/traces/d4cda95b652f4a1592b449d5929fda1b/spans/6e0c63257de34c92',
            spanId: '6e0c63257de34c92',
            status: { code: 0 },
            timeEvents: { timeEvent: [] },
            sameProcessAsParentSpan: { value: false },
        });
    });
    it('should transform spans with parent', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readableSpan.parentSpanId = '3e0c63257de34c92';
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.parentSpanId, '3e0c63257de34c92');
    });
    it('should transform spans without parent', () => {
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.parentSpanId, undefined);
    });
    it('should transform remote spans', () => {
        const remote = transformer(readableSpan);
        assert.deepStrictEqual(remote.sameProcessAsParentSpan, { value: false });
    });
    it('should transform local spans', () => {
        readableSpan.spanContext.isRemote = false;
        const local = transformer(readableSpan);
        assert.deepStrictEqual(local.sameProcessAsParentSpan, { value: true });
    });
    it('should transform attributes', () => {
        readableSpan.attributes.testBool = true;
        readableSpan.attributes.testInt = 3;
        readableSpan.attributes.testString = 'str';
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.attributes.attributeMap.testBool, {
            boolValue: true,
        });
        assert.deepStrictEqual(result.attributes.attributeMap.testInt, {
            intValue: '3',
        });
        assert.deepStrictEqual(result.attributes.attributeMap.testString, {
            stringValue: { value: 'str' },
        });
        assert.deepStrictEqual(result.attributes.droppedAttributesCount, 0);
    });
    it('should transform http attributes', () => {
        readableSpan.attributes['http.method'] = 'POST';
        readableSpan.attributes['http.scheme'] = 'https';
        readableSpan.attributes['http.host'] = 'example.com';
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.attributes.attributeMap['/http/method'], {
            stringValue: { value: 'POST' },
        });
        assert.deepStrictEqual(result.attributes.attributeMap['/http/client_protocol'], {
            stringValue: { value: 'https' },
        });
        assert.deepStrictEqual(result.attributes.attributeMap['/http/host'], {
            stringValue: { value: 'example.com' },
        });
    });
    it('should drop unknown attribute types', () => {
        // @ts-expect-error testing behavior with unsupported type
        readableSpan.attributes.testUnknownType = { message: 'dropped' };
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.attributes.droppedAttributesCount, 1);
        assert.deepStrictEqual(Object.keys(result.attributes.attributeMap).length, 5);
    });
    it('should transform links', () => {
        readableSpan.links.push({
            context: {
                traceId: 'a4cda95b652f4a1592b449d5929fda1b',
                spanId: '3e0c63257de34c92',
            },
        });
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.links, {
            link: [
                {
                    attributes: {
                        attributeMap: {},
                        droppedAttributesCount: 0,
                    },
                    traceId: 'a4cda95b652f4a1592b449d5929fda1b',
                    spanId: '3e0c63257de34c92',
                    type: types_1.LinkType.UNSPECIFIED,
                },
            ],
        });
    });
    it('should transform links with attributes', () => {
        readableSpan.links.push({
            context: {
                traceId: 'a4cda95b652f4a1592b449d5929fda1b',
                spanId: '3e0c63257de34c92',
            },
            attributes: {
                testAttr: 'value',
                // @ts-expect-error testing behavior with unsupported type
                droppedAttr: {},
            },
        });
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.links, {
            link: [
                {
                    attributes: {
                        attributeMap: {
                            testAttr: {
                                stringValue: {
                                    value: 'value',
                                },
                            },
                        },
                        droppedAttributesCount: 1,
                    },
                    traceId: 'a4cda95b652f4a1592b449d5929fda1b',
                    spanId: '3e0c63257de34c92',
                    type: types_1.LinkType.UNSPECIFIED,
                },
            ],
        });
    });
    it('should transform events', () => {
        readableSpan.events.push({
            name: 'something happened',
            time: [1566156729, 809],
        });
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.timeEvents, {
            timeEvent: [
                {
                    annotation: {
                        attributes: {
                            attributeMap: {},
                            droppedAttributesCount: 0,
                        },
                        description: {
                            value: 'something happened',
                        },
                    },
                    time: { seconds: 1566156729, nanos: 809 },
                },
            ],
        });
    });
    it('should transform events with attributes', () => {
        readableSpan.events.push({
            name: 'something happened',
            attributes: {
                error: true,
                // @ts-expect-error testing behavior with unsupported type
                dropped: {},
            },
            time: [1566156729, 809],
        });
        const result = transformer(readableSpan);
        assert.deepStrictEqual(result.timeEvents, {
            timeEvent: [
                {
                    annotation: {
                        attributes: {
                            attributeMap: {
                                error: {
                                    boolValue: true,
                                },
                            },
                            droppedAttributesCount: 1,
                        },
                        description: {
                            value: 'something happened',
                        },
                    },
                    time: { seconds: 1566156729, nanos: 809 },
                },
            ],
        });
    });
});
//# sourceMappingURL=transform.test.js.map