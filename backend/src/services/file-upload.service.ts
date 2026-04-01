import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface MLTransactionResponse {
  success: boolean;
  data: {
    transactions: Array<{
      transaction_hash: string;
      date: string;
      amount: number;
      merchant_name: string;
      description: string;
      category: string;
      category_source: string;
      is_recurring: boolean;
      tax_relevant: boolean;
      confidence: number;
      page_number: number;
      transaction_index: number;
      raw_tokens: any[];
      processed_at: string;
      processor_version: string;
    }>;
    metadata: {
      total_pages: number;
      total_transactions: number;
      processing_time: number;
      model_version: string;
    };
  };
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly mlServiceUrl: string;
  private readonly internalSecret: string;

  constructor(private configService: ConfigService) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL') || 'http://localhost:8000';
    this.internalSecret = this.configService.get<string>('INTERNAL_SECRET') || 'dev-secret-change-in-production';
  }

  /**
   * Send PDF file to ML service for processing
   */
  async processPdfWithML(fileBuffer: Buffer, originalName: string, password?: string): Promise<MLTransactionResponse> {
    try {
      this.logger.log(`Sending PDF to ML service: ${originalName}`);

      // Create FormData for multipart/form-data
      const formData = new FormData();
      // Convert Buffer to Uint8Array to satisfy TypeScript's BlobPart type
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
      formData.append('file', blob, originalName);

      if (password) {
        formData.append('password', password);
      }

      // Send to ML service categorizer endpoint
      const response: AxiosResponse<any> = await axios.post(
        `${this.mlServiceUrl}/internal/ml/categorize`,
        formData,
        {
          headers: {
            'X-Internal-Secret': this.internalSecret,
          },
          timeout: 60000, // 60 seconds — PDF processing can be slow
        }
      );

      // ML service returns { success, data: { transactions, metadata } }
      this.logger.log(`ML service processed ${response.data?.data?.transactions?.length ?? 0} transactions`);
      return response.data;

    } catch (error) {
      this.logger.error('Failed to process PDF with ML service', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('ML service authentication failed. Check INTERNAL_SECRET.');
      }
      
      if (error.response?.status === 413) {
        throw new Error('File too large for ML service processing.');
      }

      if (error.code === 'ECONNREFUSED') {
        throw new Error('ML service is not running. Please start the ML service on port 8000.');
      }

      throw new Error(`ML service error: ${error.message}`);
    }
  }

  /**
   * Validate PDF file before processing
   */
  validatePdfFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    if (file.mimetype !== 'application/pdf') {
      return { valid: false, error: 'Only PDF files are allowed' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check file header (PDF signature)
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    if (file.buffer.length < 4 || !file.buffer.subarray(0, 4).equals(pdfHeader)) {
      return { valid: false, error: 'Invalid PDF file format' };
    }

    return { valid: true };
  }

  /**
   * Check if ML service is available
   */
  async checkMLServiceHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.mlServiceUrl}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('ML service health check failed', error.message);
      return false;
    }
  }
}
