import { Module } from '@nestjs/common';
import { DailyLogsController } from './daily-logs.controller';
import { DailyLogsService } from './daily-logs.service';
import { SmsService } from '../common/sms.service';

@Module({
  controllers: [DailyLogsController],
  providers: [DailyLogsService, SmsService],
  exports: [DailyLogsService],
})
export class DailyLogsModule {}
