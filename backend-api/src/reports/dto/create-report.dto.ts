import { IsInt, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateReportDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsString()
  @IsNotEmpty()
  scopeRegion: string;
}
