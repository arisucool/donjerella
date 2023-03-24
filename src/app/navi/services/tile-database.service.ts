import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as Papa from 'papaparse';
import { CgDonjaraTile } from '../interfaces/cg-donjara-tile';
import { CgUnit } from '../interfaces/cg-unit';

@Injectable({
  providedIn: 'root',
})
export class TileDatabaseService {
  // ユニットおよび牌リストのキャッシュ有効期限 (6時間)
  private static readonly DATABASE_CACHE_EXPIRES = 1000 * 60 * 60 * 6;

  private tiles: CgDonjaraTile[] = [];
  private units: CgUnit[] = [];

  constructor() {}

  public async load() {
    await this.loadTiles();
    await this.loadUnits();
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

  private async loadTiles() {
    const cache = this.getCachedJson(
      'tiles',
      TileDatabaseService.DATABASE_CACHE_EXPIRES
    );
    if (cache) {
      this.tiles = cache;
      return;
    }

    const req = await fetch(environment.tilesCsvUrl);
    const csv = await req.text();
    const parsed = Papa.parse(csv, {
      delimiter: ',',
    });
    const rows = parsed.data as string[][];
    const tiles: CgDonjaraTile[] = [];

    for (let rowIndex = 0, len = rows.length; rowIndex < len; rowIndex++) {
      const row = rows[rowIndex];

      if (rowIndex === 0) continue;

      let identifier = row[0];
      if (identifier.length === 4) {
        // 0001 → 001 へ変換
        identifier = identifier.substring(1, 4);
      }

      tiles.push({
        identifier: identifier,
        label: row[1],
        imageUrl: `${environment.tileImageBaseUrl}/${row[0]}.png`,
        pack: 'initial',
        score: -1,
      });
    }

    this.setCachedJson('tiles', tiles);

    this.tiles = tiles;
  }

  private getTileIdentifierByIdolName(name: string) {
    return this.tiles.find((t) => t.label === name);
  }

  private async loadUnits() {
    const cache = this.getCachedJson(
      'units',
      TileDatabaseService.DATABASE_CACHE_EXPIRES
    );
    if (cache) {
      this.units = cache;
      return;
    }

    const req = await fetch(environment.unitsCsvUrl);
    const csv = await req.text();
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

    this.units = units;
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
