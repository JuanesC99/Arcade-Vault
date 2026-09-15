import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Mismas reglas que enseñaba el formulario del salón. */
export class RegistroDto {
  @IsString()
  @MinLength(3, { message: 'El usuario necesita al menos 3 caracteres.' })
  @MaxLength(16, { message: 'El usuario no puede pasar de 16 caracteres.' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Usa solo letras, números, punto, guion y guion bajo.',
  })
  usuario!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12, { message: 'El alias no puede pasar de 12 caracteres.' })
  alias?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña necesita al menos 6 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede pasar de 72 caracteres.' })
  clave!: string;
}

export class AccesoDto {
  @IsString()
  usuario!: string;

  @IsString()
  clave!: string;
}

export class AliasDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12)
  alias!: string;
}

export class CambioClaveDto {
  @IsString()
  actual!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña necesita al menos 6 caracteres.' })
  @MaxLength(72)
  nueva!: string;
}
