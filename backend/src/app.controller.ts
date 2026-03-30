import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as multer from 'multer';
import { Transaction } from './transaction.entity';

@Controller()
export class AppController {
  
  // Injecting the database connection so we can save transactions
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  // ---------------------------------------------------------
  // ROUTE 1: The File Upload (Proof of Life)
  // ---------------------------------------------------------
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file received! Make sure the field is named exactly "file".');
    }

    console.log('--- NEW FILE UPLOADED ---');
    console.log('Filename:', file.originalname);
    console.log('Size:', file.size, 'bytes');
    console.log('Buffer Preview:', file.buffer.toString('hex').substring(0, 50) + '...'); 
    
    return { 
      message: 'File successfully received in memory!',
      filename: file.originalname,
      size: file.size
    };
  }

  // ---------------------------------------------------------
  // ROUTE 2: Mock Data Insertion & Deduplication
  // ---------------------------------------------------------
  @Post('mock-data')
  async seedMockData() {
    const mockTransactions = [
      {
        hash: 'hash-12345',
        date: '2026-03-29',
        amount: 150.50,
        description: 'Grocery Store',
        category: 'Food'
      },
      {
        hash: 'hash-67890',
        date: '2026-03-29',
        amount: 45.00,
        description: 'Netflix',
        category: 'Entertainment'
      },
      // INTENTIONAL DUPLICATE to test our logic
      {
        hash: 'hash-12345',
        date: '2026-03-29',
        amount: 150.50,
        description: 'Grocery Store',
        category: 'Food'
      }
    ];

    let addedCount = 0;
    let duplicateCount = 0;

    for (const tx of mockTransactions) {
      // Look in the database for this specific hash
      const exists = await this.transactionRepository.findOne({ where: { hash: tx.hash } });
      
      if (!exists) {
        const newTx = this.transactionRepository.create(tx);
        await this.transactionRepository.save(newTx);
        addedCount++;
      } else {
        duplicateCount++; 
      }
    }

    return {
      message: 'Mock data insertion complete!',
      added: addedCount,
      duplicatesIgnored: duplicateCount
    };
  }
}