import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { ServicesModule } from './services/services.module';
import { ChildrenModule } from './children/children.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';
import { BalancesModule } from './balances/balances.module';
import { RemindersModule } from './reminders/reminders.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { GenkitModule } from './genkit/genkit.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SchoolDocumentsModule } from './school-documents/school-documents.module';
import { DisputesModule } from './disputes/disputes.module';
import { UploadthingModule } from './uploadthing/uploadthing.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../.env', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.body.password',
            'req.body.adminPassword',
            'req.body.mpesaConsumerKey',
            'req.body.mpesaConsumerSecret',
            'req.body.mpesaPasskey',
          ],
          censor: '[REDACTED]',
        },
      },
    }),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    SchoolsModule,
    ServicesModule,
    ChildrenModule,
    EnrollmentsModule,
    BillingModule,
    PaymentsModule,
    BalancesModule,
    RemindersModule,
    AuditLogsModule,
    GenkitModule,
    ReviewsModule,
    SchoolDocumentsModule,
    DisputesModule,
    UploadthingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
