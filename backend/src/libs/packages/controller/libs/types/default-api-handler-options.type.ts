import { type MultipartParsedFile } from '~/packages/files/libs/types/types.js';

type DefaultApiHandlerOptions = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  user?: unknown;
  parsedFiles?: MultipartParsedFile[];
  ref?: unknown;
};

export { type DefaultApiHandlerOptions };
