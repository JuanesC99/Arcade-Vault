import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class NuevaMarcaDto {
  @IsString()
  @MaxLength(40)
  juego!: string;

  @IsInt()
  @Min(0)
  valor!: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  unidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  etiqueta?: string;

  @IsOptional()
  @IsBoolean()
  menorEsMejor?: boolean;
}
