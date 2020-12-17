import { Metadata } from '@grpc/grpc-js';
export interface Span {
    name?: string;
    spanId?: string;
    parentSpanId?: string;
    displayName?: TruncatableString;
    startTime?: Timestamp;
    endTime?: Timestamp;
    attributes?: Attributes;
    stackTrace?: StackTrace;
    timeEvents?: TimeEvents;
    links?: Links;
    status?: Status;
    sameProcessAsParentSpan?: BoolValue;
    childSpanCount?: number;
}
export interface Timestamp {
    seconds: number;
    nanos: number;
}
export interface AttributeMap {
    [key: string]: AttributeValue;
}
export interface Attributes {
    attributeMap?: AttributeMap;
    droppedAttributesCount?: number;
}
export interface AttributeValue {
    boolValue?: boolean;
    intValue?: string;
    stringValue?: TruncatableString;
}
export interface TruncatableString {
    value?: string;
    truncatedByteCount?: number;
}
export interface Links {
    droppedLinksCount?: number;
    link?: Link[];
}
export interface Link {
    attributes?: Attributes;
    spanId?: string;
    traceId?: string;
    type?: LinkType;
}
export interface StackTrace {
    stackFrames?: StackFrames;
    stackTraceHashId?: string;
}
export interface StackFrames {
    droppedFramesCount?: number;
    frame?: StackFrame[];
}
export interface StackFrame {
    columnNumber?: string;
    fileName?: TruncatableString;
    functionName?: TruncatableString;
    lineNumber?: string;
    loadModule?: Module;
    originalFunctionName?: TruncatableString;
    sourceVersion?: TruncatableString;
}
export interface Module {
    buildId?: TruncatableString;
    module?: TruncatableString;
}
export interface Status {
    /** gRPC status code */
    code?: number;
    message?: string;
}
export interface TimeEvents {
    droppedAnnotationsCount?: number;
    droppedMessageEventsCount?: number;
    timeEvent?: TimeEvent[];
}
export interface TimeEvent {
    annotation?: Annotation;
    time?: Timestamp;
    messageEvent?: MessageEvent;
}
export interface Annotation {
    attributes?: Attributes;
    description?: TruncatableString;
}
export interface MessageEvent {
    id?: string;
    type?: Type;
    compressedSizeBytes?: string;
    uncompressedSizeBytes?: string;
}
export declare enum Type {
    TYPE_UNSPECIFIED = 0,
    SENT = 1,
    RECEIVED = 2
}
export declare enum LinkType {
    UNSPECIFIED = 0,
    CHILD_LINKED_SPAN = 1,
    PARENT_LINKED_SPAN = 2
}
/**
 * A protobuf boolean
 */
export interface BoolValue {
    value: boolean;
}
export interface NamedSpans {
    name: string;
    spans: Span[];
}
export interface TraceService {
    BatchWriteSpans: (call: NamedSpans, metadata: Metadata, callback: Function) => void;
}
