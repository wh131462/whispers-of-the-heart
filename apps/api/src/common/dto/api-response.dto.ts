export class ApiResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;

  constructor(success: boolean, message: string, data?: T, error?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = '操作成功'): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(message: string, error?: string): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, error);
  }
}

export class PaginatedResponseDto<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
