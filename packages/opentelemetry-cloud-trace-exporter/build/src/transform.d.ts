import { ReadableSpan } from '@opentelemetry/tracing';
import { Span } from './types';
export declare function getReadableSpanTransformer(projectId: string): (span: ReadableSpan) => Span;
