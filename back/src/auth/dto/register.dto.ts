import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDto {
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

  @IsString()
  @IsNotEmpty({
    message: 'La confirmación de contraseña no puede estar vacía.',
  })
  confirmPassword!: string;
}
