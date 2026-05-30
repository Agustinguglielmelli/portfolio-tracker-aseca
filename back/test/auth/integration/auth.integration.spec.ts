/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
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

  it('/auth/login (POST) - Validar longitud máxima de email y contraseña', () => {
    const longString = 'a'.repeat(257);
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `${longString}@example.com`,
        password: longString,
      })
      .expect(400);
  });

  it('/auth/login (POST) - Credenciales inválidas', () => {
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

  it('/auth/login (POST) - Login exitoso y devuelve JWT', async () => {
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

  it('/auth/register (POST) - debe registrar un usuario y devolver un access_token para autenticación automática', async () => {
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

  it('/auth/register (OPTIONS) - debe permitir peticiones CORS para que el frontend consuma la API', async () => {
    const res = await request(app.getHttpServer())
      .options('/auth/register')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(res.headers).toHaveProperty('access-control-allow-origin');
    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('/auth/login (OPTIONS) - debe permitir peticiones CORS para que el frontend consuma la API', async () => {
    const res = await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(res.headers).toHaveProperty('access-control-allow-origin');
    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });
});
