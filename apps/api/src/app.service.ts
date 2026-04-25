import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './users/dto/create-user.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'FloraPos API is running!';
  }

  /**
   * Seeds a master account if it doesn't exist.
   * Uses environment variables MASTER_EMAIL and MASTER_PASSWORD.
   */
  async seedMasterAccount() {
    const masterEmail = this.configService.get<string>('MASTER_EMAIL') || 'master@florapos.com';
    const masterPassword = this.configService.get<string>('MASTER_PASSWORD') || 'master123456';

    try {
      const existingMaster = await this.usersService.findByEmail(masterEmail);
      if (!existingMaster) {
        this.logger.log(`No master account found for ${masterEmail}. Creating one...`);
        await this.usersService.create({
          email: masterEmail,
          password: masterPassword,
          full_name: 'System Master',
          role: UserRole.MASTER,
        });
        this.logger.log(`Master account ${masterEmail} created successfully.`);
      } else {
        this.logger.log(`Master account ${masterEmail} already exists.`);
      }
    } catch (error) {
      this.logger.error(`Failed to seed master account: ${error.message}`);
    }
  }
}
