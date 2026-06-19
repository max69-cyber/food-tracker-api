import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

type Source = 'body' | 'params' | 'query';

/**
 * Returns middleware that validates the given request part against a Zod
 * schema and replaces it with the parsed (typed/coerced) value.
 */
export function validate(schema: ZodType, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // query/params are read-only getters in Express 5 — mutate in place.
    if (source === 'body') {
      req.body = result.data;
    } else {
      Object.assign(req[source], result.data);
    }
    next();
  };
}
