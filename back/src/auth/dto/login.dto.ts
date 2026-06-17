import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido.' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  @MaxLength(256, { message: 'El correo no puede ser mayor a 256 caracteres.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MaxLength(256, {
    message: 'La contraseña no puede ser mayor a 256 caracteres.',
  })
  password!: string;
}
