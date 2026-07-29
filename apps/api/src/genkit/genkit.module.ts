import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenkitService } from './genkit.service';
import { GenkitController } from './genkit.controller';

@Module({
  imports: [ConfigModule],
  controllers: [GenkitController],
  providers: [GenkitService],
  exports: [GenkitService],
})
export class GenkitModule {}
