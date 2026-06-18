import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class BuyDto {
  @IsString()
  @IsNotEmpty()
  ticker!: string;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsDateString()
  date!: string;
}
