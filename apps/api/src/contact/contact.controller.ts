import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ContactMessageDto } from './contact.dto';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(200)
  async submit(@Body() dto: ContactMessageDto, @Req() req: any) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return this.contactService.submit(dto, ip);
  }
}
