/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({
      origin: 'http://localhost:3000',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.portfolioTransaction.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.user.deleteMany();
  });

  it('/auth/register (POST) - Passwords do not match', () => {
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

  it('/auth/register (POST) - Validate maximum length of email and password', () => {
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

  it('/auth/register (POST) - Empty or omitted JSON should fail with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(400);
  });

  it('/auth/register (POST) - Missing password or confirmation should fail with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);
  });

  it('/auth/register (POST) - Invalid email format should fail with 400', async () => {
    const invalidEmails = [
      'usuario_sin_arroba',
      'usuario@.com',
      '@dominio.com',
    ];
    for (const email of invalidEmails) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(400);
    }
  });

  it('/auth/register (POST) - Whitespace in email should be trimmed and register successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: '  espacios@example.com  ',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      .expect(201);

    const user = await prisma.user.findUnique({
      where: { email: 'espacios@example.com' },
    });
    expect(user).toBeDefined();
    expect(user?.email).toEqual('espacios@example.com');
  });

  it('/auth/register (POST) - Successful registration', () => {
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

  it('/auth/register (POST) - Email already registered', async () => {
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

  it('/auth/register (POST) - Hashes the password', async () => {
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

  it('/auth/login (POST) - Validate maximum length of email and password', () => {
    const longString = 'a'.repeat(257);
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `${longString}@example.com`,
        password: longString,
      })
      .expect(400);
  });

  it('/auth/login (POST) - Invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'noexiste@example.com',
        password: 'Password123!',
      })
      .expect(401)
      .expect((res: request.Response) => {
        const body = res.body as { message: string };
        expect(body.message).toEqual('Credenciales inválidas');
      });
  });

  it('/auth/login (POST) - User exists, incorrect password', async () => {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: 'wrongpass@example.com',
        password: hashedPassword,
      },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'wrongpass@example.com',
        password: 'WrongPassword123!',
      })
      .expect(401)
      .expect((res: request.Response) => {
        const body = res.body as { message: string };
        expect(body.message).toEqual('Credenciales inválidas');
      });
  });

  it('/auth/login (POST) - Missing or omitted fields', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: 'Password123!' })
      .expect(400);

    await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
  });

  it('/auth/login (POST) - Invalid email format', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'no-es-un-correo',
        password: 'Password123!',
      })
      .expect(400);
  });

  it('/auth/login (POST) - Successful login returns JWT', async () => {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: 'valido@example.com',
        password: hashedPassword,
      },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'valido@example.com',
        password: password,
      })
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as { message: string; token: string };
        expect(body.message).toEqual('Login exitoso');
        expect(body.token).toBeDefined();
        expect(body.token.split('.').length).toBe(3);
      });
  });

  it('/auth/register (POST) - should register a user and return an access_token for automatic login', async () => {
    const registerDto = {
      email: 'autologin@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    const body = res.body as { access_token: string };

    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
  });
  afterAll(async () => {
    if (prisma) {
      await prisma.portfolioTransaction.deleteMany();
      await prisma.watchlistItem.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });
});
