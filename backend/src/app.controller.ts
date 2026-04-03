import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as multer from 'multer';
import axios from 'axios';
import { Transaction } from './transaction.entity';
import { FileUploadService } from './services/file-upload.service';
import { TransactionService } from './services/transaction.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private readonly fileUploadService: FileUploadService,
    private readonly transactionService: TransactionService,
  ) {
    // --- INTERNAL KEEP-ALIVE TRIGGER ---
    // Automatically pokes the ML service every 2 minutes to keep it lightning fast!
    setInterval(async () => {
      try {
        const mlUrl = process.env.ML_SERVICE_URL || 'https://peakpurse-ml-service.onrender.com';
        await axios.get(`${mlUrl}/ping`);
        this.logger.log(`Keep-Alive: Successfully poked ML Service at ${mlUrl}`);
      } catch (error: any) { // <--- ADDED : any HERE
        this.logger.warn('Keep-Alive: Failed to poke ML Service. Is it down?');
      }
    }, 2 * 60 * 1000); // 2 minutes
  }

  // --- UPTIMEROBOT PING ENDPOINT ---
  @Get('ping')
  keepAlivePing() {
    return {
      status: 'ok',
      service: 'PeakPurse Backend',
      timestamp: new Date().toISOString(),
      message: 'I am awake!'
    };
  }

  // Main upload route — delegates to ML service for real extraction
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file received. Make sure the field is named "file".');
    }

    const validation = this.fileUploadService.validatePdfFile(file);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    try {
      this.logger.log(`Processing upload: ${file.originalname}`);

      const mlResponse = await this.fileUploadService.processPdfWithML(
        file.buffer,
        file.originalname,
        password,
      );

      const transactions = mlResponse?.data?.transactions || [];
      let healthScore = null;

      // Best-effort DB save & Health Score Trigger
      if (transactions.length > 0) {
        try {
          const wrapped = {
            success: true,
            data: {
              transactions: transactions.map((t: any) => ({
                transaction_hash: t.transaction_hash,
                date: t.date,
                amount: t.amount,
                merchant_name: t.merchant_name,
                description: t.description,
                category: t.category,
                category_source: t.category_source || 'rule',
                is_recurring: t.is_recurring || false,
                tax_relevant: t.tax_relevant || false,
                confidence: t.confidence || 0.85,
                page_number: t.page_number || 1,
                transaction_index: t.transaction_index || 0,
                raw_tokens: [],
                processed_at: new Date().toISOString(),
                processor_version: '2.0.0',
              })),
              metadata: mlResponse.data.metadata,
            },
          } as any;
          
          // 1. Save the transactions to DB
          await this.transactionService.processMLResponse(wrapped);

          // 2. BOOM! Trigger the brand new Financial Health Score calculation
          healthScore = await this.transactionService.generateFinancialHealthScore();
          this.logger.log(`Health Score generated: ${healthScore.score}/100`);

        } catch (dbErr: any) { // <--- ADDED : any HERE
          this.logger.warn('DB save or Health Score failed (non-fatal)', dbErr.message);
        }
      }

      return {
        success: true,
        message: transactions.length > 0
          ? `Extracted ${transactions.length} transactions`
          : 'No transactions found in this PDF',
        data: {
          filename: file.originalname,
          size: file.size,
          transactions,
          health_score: healthScore, // Sending the score directly to the frontend!
          processing_time: mlResponse?.data?.metadata?.processing_time || 0,
        },
      };
    } catch (error: any) { // <--- ADDED : any HERE
      this.logger.error('Upload failed', error.message);
      throw new InternalServerErrorException(`Failed to process file: ${error.message}`);
    }
  }

  // Keep mock data endpoint for testing
  @Post('mock-data')
  async seedMockData() {
    const mockTransactions = [
      { hash: 'hash-12345', date: '2026-03-29', amount: 150.50, description: 'Grocery Store', category: 'Food' },
      { hash: 'hash-67890', date: '2026-03-29', amount: 45.00, description: 'Netflix', category: 'Entertainment' },
      { hash: 'hash-12345', date: '2026-03-29', amount: 150.50, description: 'Grocery Store', category: 'Food' },
    ];

    let addedCount = 0;
    let duplicateCount = 0;

    for (const tx of mockTransactions) {
      const exists = await this.transactionRepository.findOne({ where: { hash: tx.hash } });
      if (!exists) {
        await this.transactionRepository.save(this.transactionRepository.create(tx));
        addedCount++;
      } else {
        duplicateCount++;
      }
    }

    return { message: 'Mock data insertion complete!', added: addedCount, duplicatesIgnored: duplicateCount };
  }
}