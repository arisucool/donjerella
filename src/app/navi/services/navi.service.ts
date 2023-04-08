import { Injectable } from '@angular/core';
import { CgUnit, CgUnitDefinition } from '../interfaces/cg-unit';
import { environment } from '../../../environments/environment';
import {
  CgDonjaraHoldTile,
  CgDonjaraHoldTileGroup,
  CgDonjaraTile,
} from '../interfaces/cg-donjara-tile';
import { TileDatabaseService } from './tile-database.service';

@Injectable({
  providedIn: 'root',
})
export class NaviService {
  constructor(private tileDatabaseService: TileDatabaseService) {}

  /**
   * 指定された手牌によるユニットの取得
   * @param selectedTile 指定された手牌
   * @param holdTiles すべての手牌
   * @returns ユニットの配列
   */
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

  /**
   * 手牌に含まれる牌を持つユニットの取得
   * @param holdTiles 手牌の配列
   * @returns ユニットの配列
   */
  async getRecommendedUnitsByHoldTiles(
    holdTiles: CgDonjaraTile[],
    removeDuplicatedAssigns: boolean = false
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
            idolStatus: 'vocal',
            idolType: 'cute',
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

    // 牌の重複を除去
    if (removeDuplicatedAssigns) {
      const usedTileIdentifiers: string[] = [];
      filteredUnits = filteredUnits.filter((u) => {
        let isDuplicated = false;
        for (const tile of u.tiles!) {
          if (usedTileIdentifiers.includes(tile.identifier)) {
            isDuplicated = true;
            break;
          }
        }
        if (!isDuplicated) {
          for (const tile of u.tiles!) {
            usedTileIdentifiers.push(tile.identifier);
          }
        }
        return !isDuplicated;
      });
    }

    // ユニットの配列を返す
    return filteredUnits;
  }

  /**
   * 手牌のグルーピング
   * @param cgTiles 手牌
   */
  async groupingHoldTiles(
    cgTiles: CgDonjaraTile[]
  ): Promise<CgDonjaraHoldTile[]> {
    // 手牌を含むユニットを取得
    const recommendedUnits = await this.getRecommendedUnitsByHoldTiles(
      cgTiles,
      true
    );

    // 手牌を反復
    const suggestedGroups: { [key: string]: CgDonjaraHoldTileGroup } = {};
    const tiles: CgDonjaraHoldTile[] = [];
    for (const cgTile of cgTiles) {
      // 提案されるユニットを取得
      let suggestedUnit: CgUnit | undefined = undefined;
      if (recommendedUnits) {
        for (const unit of recommendedUnits) {
          if (
            unit.tiles!.some(
              (t: CgDonjaraTile) => t.identifier === cgTile.identifier
            )
          ) {
            suggestedUnit = unit;
            break;
          }
        }
      }

      // グルーピング情報を設定
      let suggestedGroup: CgDonjaraHoldTileGroup | undefined;
      if (
        suggestedUnit &&
        suggestedUnit.numOfHoldTiles &&
        2 <= suggestedUnit.numOfHoldTiles
      ) {
        if (suggestedGroups[suggestedUnit.label!]) {
          suggestedGroup = suggestedGroups[suggestedUnit.label!];
        } else {
          const countOfGroups = Object.keys(suggestedGroups).length;
          const groupingLabel = String.fromCharCode(65 + countOfGroups);
          suggestedGroups[suggestedUnit.label!] = {
            groupingColor: this.getGroupingColorByNumber(countOfGroups),
            groupingLabel: groupingLabel,
            unit: suggestedUnit,
          };
        }
        suggestedGroup = suggestedGroups[suggestedUnit.label!];
      }

      // 配列へ牌を追加
      const tile: CgDonjaraHoldTile = {
        ...cgTile,
        suggestedGroup: suggestedGroup,
      };
      tiles.push(tile);
    }

    return tiles;
  }

  getGroupingColorByNumber(countOfGroups: number): string {
    const colors = [
      // A - 水色
      '#18c3d9',
      // B - 赤
      '#d9185c',
      // C - 黄緑
      '#a2d918',
      // D - オレンジ
      '#d97818',
      // E - 紫
      '#8418d9',
      // F - 緑
      '#18d928',
    ];

    const index = countOfGroups % colors.length;
    if (index >= colors.length) {
      return '#000000';
    }

    return colors[index];
  }
}
