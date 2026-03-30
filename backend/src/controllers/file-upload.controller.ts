import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  Body, 
  BadRequestException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { FileUploadService } from '../services/file-upload.service';
import { TransactionService } from '../services/transaction.service';

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    size: number;
    transactions: any[];
    processing_time: number;
    stats: {
      total: number;
      added: number;
      duplicates: number;
      errors: string[];
    };
  };
  error?: string;
}

@Controller('upload')
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password?: string,
  ): Promise<UploadResponse> {
    try {
      // Validate file
      const validation = this.fileUploadService.validatePdfFile(file);
      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }

      this.logger.log(`Processing PDF upload: ${file.originalname}`);

      // Send to ML service
      const mlResponse = await this.fileUploadService.processPdfWithML(
        file.buffer,
        file.originalname,
        password,
      );

      // Process transactions and save to database
      const result = await this.transactionService.processMLResponse(mlResponse);

      return {
        success: true,
        message: 'File processed successfully',
        data: {
          filename: file.originalname,
          size: file.size,
          transactions: result.transactions,
          processing_time: mlResponse.data.metadata.processing_time,
          stats: {
            total: result.total,
            added: result.added,
            duplicates: result.duplicates,
            errors: result.errors,
          },
        },
      };

    } catch (error) {
      this.logger.error('File upload failed', error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to process file: ${error.message}`,
      );
    }
  }

  @Post('batch')
  @UseInterceptors(FileInterceptor('files', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB total for batch
  }))
  async uploadMultipleFiles(
    @UploadedFile() files: Express.Multer.File[],
  ): Promise<{ success: boolean; results: UploadResponse[]; total: { processed: number; added: number; errors: number } }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per batch');
    }

    const results: UploadResponse[] = [];
    const total = { processed: 0, added: 0, errors: 0 };

    this.logger.log(`Processing batch upload: ${files.length} files`);

    for (const file of files) {
      try {
        const result = await this.uploadFile(file);
        results.push(result);
        
        if (result.success && result.data) {
          total.processed += result.data.stats.total;
          total.added += result.data.stats.added;
          total.errors += result.data.stats.errors.length;
        } else {
          total.errors++;
        }
      } catch (error) {
        this.logger.error(`Failed to process file ${file.originalname}`, error);
        results.push({
          success: false,
          message: `Failed to process ${file.originalname}`,
          error: error.message,
        });
        total.errors++;
      }
    }

    return {
      success: true,
      results,
      total,
    };
  }

  @Post('validate')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  async validateFile(@UploadedFile() file: Express.Multer.File): Promise<{
    valid: boolean;
    filename: string;
    size: number;
    estimated_processing_time: number;
    ml_service_available: boolean;
  }> {
    const validation = this.fileUploadService.validatePdfFile(file);
    const mlServiceAvailable = await this.fileUploadService.checkMLServiceHealth();
    
    // Estimate processing time (rough calculation: ~2 seconds per page, assume 5 pages average)
    const estimatedTime = mlServiceAvailable ? 10 : 0;

    return {
      valid: validation.valid,
      filename: file.originalname,
      size: file.size,
      estimated_processing_time: estimatedTime,
      ml_service_available: mlServiceAvailable,
    };
  }
}
