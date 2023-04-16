import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as Papa from 'papaparse';
import { CgDonjaraTile } from '../../shared/interfaces/cg-donjara-tile';
import { CgUnit } from '../../shared/interfaces/cg-unit';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TileDatabaseService {
  // ユニットおよび牌リストのキャッシュ有効期限 (6時間)
  private static readonly DATABASE_CACHE_EXPIRES = 1000 * 60 * 60 * 6;

  private tiles: CgDonjaraTile[] = [];
  private units: CgUnit[] = [];

  constructor(private http: HttpClient) {}

  public async load() {
    const tiles = await this.fetchTiles();
    this.tiles = tiles!;
    const units = await this.fetchUnits();
    this.units = units!;
  }

  async getTiles() {
    if (!this.tiles.length) {
      await this.load();
    }
    return this.tiles;
  }

  async getTileByIdentifier(
    identifier: string
  ): Promise<CgDonjaraTile | undefined> {
    if (!this.tiles.length) {
      await this.load();
    }

    if (identifier.length === 4) {
      // 0001 → 001 へ変換
      identifier = identifier.substring(1, 4);
    }

    const tile = this.tiles.find((t) => t.identifier === identifier);
    return tile;
  }

  async getUnits() {
    if (!this.tiles.length) {
      await this.load();
    }
    return this.units;
  }

  async fetchTiles() {
    const cache = this.getCachedJson(
      'tiles',
      TileDatabaseService.DATABASE_CACHE_EXPIRES
    );
    if (cache) {
      return cache;
    }

    const csv = await lastValueFrom(
      this.http.get(environment.tilesCsvUrl, { responseType: 'text' })
    );
    const parsed = Papa.parse(csv, {
      delimiter: ',',
    });
    const rows = parsed.data as string[][];
    const tiles: CgDonjaraTile[] = [];

    for (let rowIndex = 0, len = rows.length; rowIndex < len; rowIndex++) {
      const row = rows[rowIndex];

      if (rowIndex === 0) continue;

      // 識別子を取得
      let identifier = row[0].trim();
      if (identifier.length === 4) {
        // 0001 → 001 へ変換
        identifier = identifier.substring(1, 4);
      }

      // 牌のラベルを取得 (例: '橘ありす', 'キュートオールマイティ')
      const label = row[1].trim();

      // アイドルのよみがなを取得
      const idolYomi = row[2].trim();

      // アイドルの属性を抽出
      let idolType: 'cute' | 'cool' | 'passion';
      switch (row[3].trim()) {
        case 'キュート':
          idolType = 'cute';
          break;
        case 'クール':
          idolType = 'cool';
          break;
        case 'パッション':
          idolType = 'passion';
          break;
        default:
          console.warn(
            `[TileDatabaseService] fetchTiles - Unknown idol type: ${row[3]}`
          );
          continue;
      }

      // アイドルのステータスを抽出
      let idolStatus: 'vocal' | 'visual' | 'dance' | 'almighty';
      switch (row[4].trim()) {
        case 'Vo':
          idolStatus = 'vocal';
          break;
        case 'Vi':
          idolStatus = 'visual';
          break;
        case 'Da':
          idolStatus = 'dance';
          break;
        case 'Al':
          idolStatus = 'almighty';
          break;
        default:
          console.warn(
            `[TileDatabaseService] fetchTiles - Unknown idol status: ${row[4]}`
          );
          continue;
      }

      // 配列へ牌を追加
      tiles.push({
        identifier: identifier,
        label: label,
        imageUrl: `${environment.tileImageBaseUrl}/${row[0].trim()}.png`,
        pack: 'initial',
        idolYomi: idolYomi,
        idolType: idolType,
        idolStatus: idolStatus,
      });
    }

    this.setCachedJson('tiles', tiles);

    return tiles;
  }

  private getTileIdentifierByIdolName(name: string) {
    return this.tiles.find((t) => t.label === name);
  }

  async fetchUnits() {
    const cache = this.getCachedJson(
      'units',
      TileDatabaseService.DATABASE_CACHE_EXPIRES
    );
    if (cache) {
      return cache;
    }

    const csv = await lastValueFrom(
      this.http.get(environment.unitsCsvUrl, { responseType: 'text' })
    );
    const parsed = Papa.parse(csv, {
      delimiter: ',',
    });
    const rows = parsed.data as string[][];

    const units: CgUnit[] = [];
    for (let rowIndex = 0, len = rows.length; rowIndex < len; rowIndex++) {
      const row = rows[rowIndex];
      if (rowIndex === 0) continue;

      const unitLabel = row[0];
      const membersText = row[2];
      if (unitLabel.length === 0) {
        continue;
      }

      const members = membersText.split(',');
      const tileIdentifiers: string[] = [];
      for (const member of members) {
        const tileIdentifier = this.getTileIdentifierByIdolName(member);
        if (tileIdentifier) {
          tileIdentifiers.push(tileIdentifier.identifier);
        }
      }

      const unit: CgUnit = {
        label: unitLabel,
        numOfMembers: members.length,
        tileIdentifiers: tileIdentifiers,
        listed: {},
      };

      units.push(unit);
    }

    this.setCachedJson('units', units);
    return units;
  }

  private getCachedJson(key: string, expires?: number) {
    const cacheStr = window.localStorage.getItem(`cache_cgdonav__${key}`);
    if (cacheStr === null) return undefined;

    let cache: {
      content: any;
      createdAt: number;
    };
    try {
      cache = JSON.parse(cacheStr);
    } catch (e: any) {
      return undefined;
    }
    if (!cache || !cache.content || !cache.createdAt) {
      return undefined;
    }

    const now = new Date().getTime();
    if (expires !== undefined && expires < now - cache.createdAt) {
      window.localStorage.removeItem(key);
      return undefined;
    }

    return cache['content'];
  }

  private setCachedJson(key: string, content: any) {
    const now = new Date().getTime();

    if (typeof content === 'string') {
      content = JSON.parse(content);
    }

    const cache = {
      content: content,
      createdAt: now,
    };
    window.localStorage.setItem(`cache_cgdonav__${key}`, JSON.stringify(cache));
  }
}
