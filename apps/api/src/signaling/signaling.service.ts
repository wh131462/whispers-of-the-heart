import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface IceServerConfigResponse {
  iceServers: IceServerConfig[];
  credentialExpiresAt: number | null;
}

const DEFAULT_STUN_URLS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

@Injectable()
export class SignalingService {
  constructor(private readonly configService: ConfigService) {}

  getIceServers(): IceServerConfigResponse {
    const stunUrls = this.getUrls('STUN_URLS', ['stun:'], DEFAULT_STUN_URLS);
    const turnUrls = this.getUrls('TURN_URLS', ['turn:', 'turns:'], []);
    const iceServers: IceServerConfig[] = [{ urls: stunUrls }];

    if (turnUrls.length === 0) {
      return { iceServers, credentialExpiresAt: null };
    }

    const sharedSecret = this.configService.get<string>('TURN_SHARED_SECRET');
    if (sharedSecret) {
      const ttlSeconds = this.getCredentialTtl();
      const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
      const username = `${expiresAt}:whispers-p2p`;
      const credential = createHmac('sha1', sharedSecret)
        .update(username)
        .digest('base64');
      iceServers.push({ urls: turnUrls, username, credential });
      return { iceServers, credentialExpiresAt: expiresAt };
    }

    const username = this.configService.get<string>('TURN_USERNAME');
    const credential = this.configService.get<string>('TURN_CREDENTIAL');
    if (username && credential) {
      iceServers.push({ urls: turnUrls, username, credential });
    }

    return { iceServers, credentialExpiresAt: null };
  }

  private getUrls(
    key: string,
    allowedPrefixes: string[],
    fallback: string[],
  ): string[] {
    const configured = this.configService.get<string>(key);
    if (!configured) return fallback;

    const urls = configured
      .split(',')
      .map((url) => url.trim())
      .filter((url) =>
        allowedPrefixes.some((prefix) => url.toLowerCase().startsWith(prefix)),
      );
    return urls.length > 0 ? urls : fallback;
  }

  private getCredentialTtl(): number {
    const configured = Number(
      this.configService.get<string>('TURN_CREDENTIAL_TTL_SECONDS') || 3600,
    );
    if (!Number.isFinite(configured)) return 3600;
    return Math.min(86400, Math.max(300, Math.floor(configured)));
  }
}
