import { Controller, Get } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transaction.entity';

@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  @Get()
  async healthCheck() {
    try {
      // Check database connection
      const dbStatus = await this.checkDatabase();
      
      // Check ML service availability
      const mlServiceStatus = await this.checkMLService();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: dbStatus,
          ml_service: mlServiceStatus,
        },
        environment: {
          node_env: this.configService.get('NODE_ENV') || 'development',
          port: this.configService.get('PORT') || 3000,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('detailed')
  async detailedHealthCheck() {
    try {
      const dbStatus = await this.checkDatabase();
      const mlServiceStatus = await this.checkMLService();
      const transactionCount = await this.getTransactionCount();
      const memoryUsage = process.memoryUsage();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        services: {
          database: dbStatus,
          ml_service: mlServiceStatus,
        },
        metrics: {
          transaction_count: transactionCount,
          memory_usage: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heap_used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heap_total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          },
        },
        environment: {
          node_env: this.configService.get('NODE_ENV') || 'development',
          port: this.configService.get('PORT') || 3000,
          database_host: this.configService.get('DB_HOST') || 'localhost',
          ml_service_url: this.configService.get('ML_SERVICE_URL') || 'http://localhost:8000',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      };
    }
  }

  private async checkDatabase(): Promise<{ status: string; response_time?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.transactionRepository.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        response_time: responseTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  private async checkMLService(): Promise<{ status: string; response_time?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const mlServiceUrl = this.configService.get('ML_SERVICE_URL') || 'http://localhost:8000';
      
      await axios.get(`${mlServiceUrl}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        response_time: responseTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  private async getTransactionCount(): Promise<number> {
    try {
      return await this.transactionRepository.count();
    } catch (error) {
      return 0;
    }
  }
}
