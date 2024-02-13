import { Request, Response } from 'express';

import { assertUnsignedBigInt } from './validation';

// ETag Functions

type WeakETag = `W/${string}`;
type ETag = WeakETag | string;

export const WeakETagRegex = /W\/"(\d+.*)"/;

export const enum ETagErrors {
  WRONG_WEAK_ETAG_FORMAT = 'WRONG_WEAK_ETAG_FORMAT',
  MISSING_IF_MATCH_HEADER = 'MISSING_IF_MATCH_HEADER',
}

// Test is weak ETag
export const isWeakETag = (etag: ETag): etag is WeakETag => {
  return WeakETagRegex.test(etag);
};

// Get ETag value using WeakETagRegex
export const getWeakETagValue = (etag: ETag): WeakETag => {
  const weak = WeakETagRegex.exec(etag);
  if (weak == null || weak.length == 0)
    throw new Error(ETagErrors.WRONG_WEAK_ETAG_FORMAT);
  return weak[1] as WeakETag;
};

// Turn value into WeakETag
export const toWeakETag = (value: number | bigint | string): WeakETag => {
  return `W/"${value}"`;
};

// Obtain ETag from If Match header.
export const getETagFromIfMatch = (request: Request): ETag => {
  const etag = request.headers['if-match'];

  if (etag === undefined) {
    throw ETagErrors.MISSING_IF_MATCH_HEADER;
  }

  return etag;
};

// Obtain ETag value from If Match header.
export const getWeakETagValueFromIfMatch = (request: Request): WeakETag => {
  const etag = getETagFromIfMatch(request);

  if (!isWeakETag(etag)) {
    throw ETagErrors.WRONG_WEAK_ETAG_FORMAT;
  }

  return getWeakETagValue(etag);
};

// Get the expected revision from ETag.
export const getExpectedRevisionFromETag = (request: Request): bigint =>
  assertUnsignedBigInt(getWeakETagValueFromIfMatch(request));

// HTTP Helpers

// Sets the response header, status and createdId to the application back-end.
export const sendCreated = (
    response: Response,
    createdId: string,
    urlPrefix?: string,
  ): void => {
    response.setHeader(
      'Location',
      `${urlPrefix ?? response.req.url}/${createdId}`,
    );
    response.status(201).json({ id: createdId });
  };