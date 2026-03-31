import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  session_id?: string;
}

export class ChatResponseDto {
  session_id: string;
  reply: string;
  intent?: string;
  disclaimer?: string;
  turns_count: number;
}
