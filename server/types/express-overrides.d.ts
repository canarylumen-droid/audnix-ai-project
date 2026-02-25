// Override Express.Request.params to return string instead of string | string[]
// This is safe because in typical Express usage, named route parameters are never arrays
declare global {
  namespace Express {
    interface Request {
      params: Record<string, string>;
      query: Record<string, string>;
    }
  }
}

export {};
