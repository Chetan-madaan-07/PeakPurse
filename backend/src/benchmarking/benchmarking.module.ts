import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction.entity';
import { BenchmarkingController } from './benchmarking.controller';
import { BenchmarkingService } from './benchmarking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [BenchmarkingController],
  providers: [BenchmarkingService],
})
export class BenchmarkingModule {}
