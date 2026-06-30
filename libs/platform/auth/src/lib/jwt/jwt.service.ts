import * as jwt from 'jsonwebtoken';
import {
  JwtPayload,
  UserId,
  WorkspaceId,
  RoleName,
} from '@kodem/contracts';

export interface JwtServiceConfig {
  secret: string;
  expiresIn?: string | number;
}

export class JwtService {
  constructor(private readonly config: JwtServiceConfig) {}

  sign(payload: {
    sub: UserId;
    email: string;
    workspaceId: WorkspaceId;
    role: RoleName;
  }): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn ?? '7d',
    } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.config.secret);
    if (typeof decoded === 'string' || !decoded) {
      throw new Error('Invalid token');
    }
    const payload = decoded as JwtPayload;
    if (!payload.sub || !payload.workspaceId || !payload.role) {
      throw new Error('Token missing required workspace context');
    }
    return payload;
  }
}
