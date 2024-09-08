import { Type, ɵstringify as stringify } from '@angular/core';

export class InvalidPipeArgumentError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function invalidPipeArgumentError(
  type: Type<unknown>,
  value: unknown,
): InvalidPipeArgumentError {
  return new InvalidPipeArgumentError(
    `InvalidPipeArgument: '${value}' for pipe '${stringify(type)}'`,
  );
}
