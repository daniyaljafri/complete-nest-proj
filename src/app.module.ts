
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
    consumer
      .apply(AdminRegistrationMiddleware, SupervisorLoginMiddleware, AuthMiddleware, RolesMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
