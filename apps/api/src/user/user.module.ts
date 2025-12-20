import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MediaModule } from '../media/media.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MediaModule, MailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
