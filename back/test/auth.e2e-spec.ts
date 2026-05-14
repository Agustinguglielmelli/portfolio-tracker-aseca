import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('/auth/register (POST) - Contraseñas no coinciden', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password456!',
      })
      .expect(400)
      .expect((res: request.Response) => {
        const body = res.body as { message: string };
        expect(body.message).toEqual(
          'Las contraseñas no son iguales, por favor, vuelva a ingresarlas.',
        );
      });
  });

  it('/auth/register (POST) - Validar longitud máxima de email y contraseña', () => {
    const longString = 'a'.repeat(257);
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `${longString}@example.com`,
        password: longString,
        confirmPassword: longString,
      })
      .expect(400);
  });

  it('/auth/register (POST) - Registro exitoso', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'nuevo@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      .expect(201)
      .expect((res: request.Response) => {
        const body = res.body as { message: string };
        expect(body.message).toEqual('Registro exitoso');
      });
  });

  it('/auth/register (POST) - Mail ya registrado', async () => {
    const userData = {
      email: 'unico@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };

    await request(app.getHttpServer()).post('/auth/register').send(userData);

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(400)
      .expect((res: request.Response) => {
        const body = res.body as { message: string };
        expect(body.message).toEqual('El mail ya está registrado');
      });
  });

  it('/auth/register (POST) - Encripta la contraseña', async () => {
    const email = 'encriptado@example.com';
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        confirmPassword: password,
      })
      .expect(201);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeDefined();
    expect(user?.password).not.toEqual(password);

    const isMatch = await bcrypt.compare(password, user?.password as string);
    expect(isMatch).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
