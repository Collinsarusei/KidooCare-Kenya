import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
