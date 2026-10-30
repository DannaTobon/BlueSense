import type { RequestHandler } from 'express';

export const meHandler: RequestHandler = (request, response) => {
  const identity = request.auth;

  if (!identity) {
    response.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
    return;
  }

  response.status(200).json({
    uid: identity.uid,
    email: identity.email,
  });
};
