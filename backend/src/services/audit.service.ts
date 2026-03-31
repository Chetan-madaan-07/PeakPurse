import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit-log.entity'; // The '../' is key here!

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(eventType: string, userId: string, metadata: any) {
    try {
      const entry = this.auditRepository.create({
        event_type: eventType,
        user_id: userId,
        metadata,
      });
      await this.auditRepository.save(entry);
      this.logger.log(`Audit Log Saved: ${eventType} for User ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${error.message}`);
    }
  }
}