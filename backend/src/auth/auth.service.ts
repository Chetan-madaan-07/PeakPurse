import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({ email: dto.email, password: hash, name: dto.name });
    await this.userRepository.save(user);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const { password, ...profile } = user;
    return profile;
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
