import type { UserRole } from '../types/domain';

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'owner':
      return '/owner';
    case 'admin':
      return '/admin';
    default:
      return '/feed';
  }
}
