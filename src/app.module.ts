
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RolesMiddleware } from './middleware/roles.middleware';
import { AdminRegistrationMiddleware } from './middleware/admin-registration.middleware';
import { SupervisorLoginMiddleware } from './middleware/supervisor-login.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://daniyaljafri:0Y3wJXAH6iTnjKUf@cluster0.r6c6kry.mongodb.net/texel?retryWrites=true&w=majority&appName=Cluster0'),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-for-development-only-change-in-production',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    UsersModule,
    SessionsModule,
  ],
  providers: [AuthMiddleware, RolesMiddleware, AdminRegistrationMiddleware, SupervisorLoginMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Step 1: Apply business logic middlewares to registration route
    consumer
      .apply(AdminRegistrationMiddleware)
      .forRoutes({ path: 'users/register', method: RequestMethod.POST });

    // Step 2: Apply supervisor login middleware to login route
    consumer
      .apply(SupervisorLoginMiddleware)
      .forRoutes({ path: 'users/login', method: RequestMethod.POST });

    // Step 3: Apply auth middleware to all routes EXCEPT public ones
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'users/register', method: RequestMethod.POST },
        { path: 'users/login', method: RequestMethod.POST }
      )
      .forRoutes('*');

    // Step 4: Apply roles middleware to protected routes that need role checks
    consumer
      .apply(RolesMiddleware)
      .forRoutes(
        { path: 'users/logged-in-users', method: RequestMethod.GET },
        { path: 'sessions/all', method: RequestMethod.GET },
        { path: 'sessions/dates', method: RequestMethod.GET }
      );
  }
}
