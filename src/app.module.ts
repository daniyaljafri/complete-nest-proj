
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://daniyaljafri:0Y3wJXAH6iTnjKUf@cluster0.r6c6kry.mongodb.net/texel?retryWrites=true&w=majority&appName=Cluster0'),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
