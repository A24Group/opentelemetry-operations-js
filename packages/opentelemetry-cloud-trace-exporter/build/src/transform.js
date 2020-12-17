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
exports.getReadableSpanTransformer = void 0;
const core_1 = require("@opentelemetry/core");
const resources_1 = require("@opentelemetry/resources");
const types_1 = require("./types");
const version_1 = require("./version");
const AGENT_LABEL_KEY = 'g.co/agent';
const AGENT_LABEL_VALUE = `opentelemetry-js ${core_1.VERSION}; google-cloud-trace-exporter ${version_1.VERSION}`;
function getReadableSpanTransformer(projectId) {
    return span => {
        const attributes = transformAttributes(span.attributes, {
            project_id: projectId,
            [AGENT_LABEL_KEY]: AGENT_LABEL_VALUE,
        }, span.resource);
        const out = {
            attributes,
            displayName: stringToTruncatableString(span.name),
            links: {
                link: span.links.map(transformLink),
            },
            endTime: transformTime(span.endTime),
            startTime: transformTime(span.startTime),
            name: `projects/${projectId}/traces/${span.spanContext.traceId}/spans/${span.spanContext.spanId}`,
            spanId: span.spanContext.spanId,
            sameProcessAsParentSpan: { value: !span.spanContext.isRemote },
            status: span.status,
            timeEvents: {
                timeEvent: span.events.map(e => ({
                    time: transformTime(e.time),
                    annotation: {
                        attributes: transformAttributes(e.attributes),
                        description: stringToTruncatableString(e.name),
                    },
                })),
            },
        };
        if (span.parentSpanId) {
            out.parentSpanId = span.parentSpanId;
        }
        return out;
    };
}
exports.getReadableSpanTransformer = getReadableSpanTransformer;
function transformTime(time) {
    return {
        seconds: time[0],
        nanos: time[1],
    };
}
function transformLink(link) {
    return {
        attributes: transformAttributes(link.attributes),
        spanId: link.context.spanId,
        traceId: link.context.traceId,
        type: types_1.LinkType.UNSPECIFIED,
    };
}
function transformAttributes(requestAttributes = {}, serviceAttributes = {}, resource = resources_1.Resource.empty()) {
    const attributes = Object.assign({}, requestAttributes, serviceAttributes, resource.attributes);
    const changedAttributes = transformAttributeNames(attributes);
    const attributeMap = transformAttributeValues(changedAttributes);
    return {
        attributeMap,
        // @todo get dropped attribute count from sdk ReadableSpan
        droppedAttributesCount: Object.keys(attributes).length - Object.keys(attributeMap).length,
    };
}
function transformAttributeValues(attributes) {
    const out = {};
    for (const [key, value] of Object.entries(attributes)) {
        switch (typeof value) {
            case 'number':
            case 'boolean':
            case 'string':
                out[key] = valueToAttributeValue(value);
                break;
            default:
                break;
        }
    }
    return out;
}
function stringToTruncatableString(value) {
    return { value };
}
function valueToAttributeValue(value) {
    switch (typeof value) {
        case 'number':
            // TODO: Consider to change to doubleValue when available in V2 API.
            return { intValue: String(Math.round(value)) };
        case 'boolean':
            return { boolValue: value };
        case 'string':
            return { stringValue: stringToTruncatableString(value) };
        default:
            return {};
    }
}
const HTTP_ATTRIBUTE_MAPPING = {
    'http.method': '/http/method',
    'http.url': '/http/url',
    'http.target': '/http/target',
    'http.host': '/http/host',
    'http.scheme': '/http/client_protocol',
    'http.status_code': '/http/status_code',
    'http.flavor': '/http/flavor',
    'http.user_agent': '/http/user_agent',
    'http.request_content_length': '/http/request_content_length',
    'http.request_content_length_uncompressed': '/http/request_content_length_uncompressed',
    'http.response_content_length': '/http/response_content_length',
    'http.response_content_length_uncompressed': '/http/response_content_length_uncompressed',
    'http.server_name': '/http/server_name',
    'http.route': '/http/route',
    'http.client_ip': '/http/client_ip',
    'http.path': '/http/path',
};
function transformAttributeNames(attributes) {
    const out = {};
    for (const [key, value] of Object.entries(attributes)) {
        if (HTTP_ATTRIBUTE_MAPPING[key]) {
            out[HTTP_ATTRIBUTE_MAPPING[key]] = value;
        }
        else {
            out[key] = value;
        }
    }
    return out;
}
//# sourceMappingURL=transform.js.map