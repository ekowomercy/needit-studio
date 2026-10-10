import { randomUUID } from 'node:crypto';

function id(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export { id };