import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxProfile } from './tax.entity';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxProfile])],
  controllers: [TaxController],
  providers: [TaxService],
})
export class TaxModule {}
