import { User, UserId } from '@kodem/contracts';
import { UserRepository } from '@kodem/database';
import * as bcrypt from 'bcryptjs';

export class UserService {
  private readonly userRepo = new UserRepository();

  async findById(id: UserId): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  async createWithPassword(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.userRepo.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
  }

  async verifyPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const record = await this.userRepo.findByEmailWithPassword(email);
    if (!record?.passwordHash) return null;

    const valid = await bcrypt.compare(password, record.passwordHash);
    return valid ? record.user : null;
  }

  async createOAuthUser(input: {
    email: string;
    name: string;
  }): Promise<User> {
    return this.userRepo.create({
      email: input.email,
      name: input.name,
    });
  }
}
