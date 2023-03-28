import { Injectable } from '@angular/core';
import { CgUnit, CgUnitDefinition } from '../interfaces/cg-unit';
import { environment } from 'src/environments/environment';
import { CgDonjaraTile } from '../interfaces/cg-donjara-tile';
import { TileDatabaseService } from './tile-database.service';

@Injectable({
  providedIn: 'root',
})
export class NaviService {
  constructor(private tileDatabaseService: TileDatabaseService) {}

  async getRecommendedUnits(
    selectedTile: CgDonjaraTile,
    holdTiles: CgDonjaraTile[]
  ) {
    let units = await this.getRecommendedUnitsByHoldTiles(holdTiles);
    units = units.filter((u) =>
      u.tiles!.some((t) => t.identifier === selectedTile.identifier)
    );
    return units;
  }

  async getRecommendedUnitsByHoldTiles(
    holdTiles: CgDonjaraTile[]
  ): Promise<CgUnit[]> {
    const allUnits: CgUnit[] = await this.tileDatabaseService.getUnits();
    let filteredUnits: CgUnit[] = [];
    for (const unitDefinition of allUnits) {
      let unit: CgUnit = {
        ...unitDefinition,
        tiles: [],
      };

      // ユニットメンバーが手牌に含まれる数をカウント
      let numOfHoldTiles = 0;
      for (const tileIdentifier of unitDefinition.tileIdentifiers!) {
        if (holdTiles.some((t) => t.identifier === tileIdentifier)) {
          numOfHoldTiles++;
        }
      }
      if (numOfHoldTiles === 0) {
        // 一人も含まれないならば
        continue;
      }
      unit.numOfHoldTiles = numOfHoldTiles;

      // ユニットメンバーの牌の情報を付加
      for (const tileIdentifier of unitDefinition.tileIdentifiers!) {
        const tile = await this.tileDatabaseService.getTileByIdentifier(
          tileIdentifier
        );
        if (!tile) {
          // 牌が見つからないならば
          unit.tiles!.push({
            identifier: 'UNKNOWN',
            label: '不明',
            imageUrl: '',
            pack: 'initial',
            isHold: false,
            score: 0,
          });
          continue;
        }

        unit.tiles!.push({
          ...tile,
          isHold: holdTiles.some((t) => t.identifier === tile.identifier),
        });
      }

      // ユニットのメンバーをソート (手牌にあるものを先頭に)
      unit.tiles!.sort((a, b) => {
        if (a.isHold && !b.isHold) {
          return -1;
        } else if (!a.isHold && b.isHold) {
          return 1;
        } else {
          return 0;
        }
      });

      // ユニットを配列へ追加
      filteredUnits.push(unit);
    }

    // 手牌に含まれるメンバーの数が多いユニットを優先してソート
    filteredUnits.sort((a, b) => {
      if (a.numOfHoldTiles! > b.numOfHoldTiles!) {
        return -1;
      } else if (a.numOfHoldTiles! < b.numOfHoldTiles!) {
        return 1;
      } else {
        return 0;
      }
    });

    // 残りの必要な牌の数が少ないユニットを優先してソート
    filteredUnits.sort((a, b) => {
      if (a.numOfHoldTiles! === b.numOfHoldTiles!) {
        if (
          a.tiles!.length - a.numOfHoldTiles! <
          b.tiles!.length - b.numOfHoldTiles!
        ) {
          return -1;
        } else if (
          a.tiles!.length - a.numOfHoldTiles! >
          b.tiles!.length - b.numOfHoldTiles!
        ) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    });

    // ユニットの配列を返す
    return filteredUnits;
  }
}
