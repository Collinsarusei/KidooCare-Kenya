import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CredentialsService } from './credentials/credentials.service';
import { AdminSchoolsController } from './admin-schools.controller';
import { SchoolsController } from './schools.controller';
import { PublicSchoolsController } from './public-schools.controller';
import { EmailService } from '../common/email.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [AdminSchoolsController, SchoolsController, PublicSchoolsController],
  providers: [SchoolsService, CredentialsService, EmailService],
  exports: [SchoolsService, CredentialsService, EmailService],
})
export class SchoolsModule {}
