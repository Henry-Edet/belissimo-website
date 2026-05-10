// src/auth/role.decorator.ts
// Uses Role enum — import Role from user.entity everywhere

import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/user.entity';

export const ROLES_KEY = 'roles';

// Usage in controllers:
// @Roles(Role.ADMIN)           ← admin only
// @Roles(Role.ADMIN, Role.STYLIST)  ← admin or stylist
// @Roles(Role.CLIENT)          ← clients only
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);