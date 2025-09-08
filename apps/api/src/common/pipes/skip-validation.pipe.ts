import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SkipValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 直接返回原始值，不进行任何验证
    return value;
  }
}
