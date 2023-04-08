import { DonjaraTileScannerResultItem } from 'src/app/shared/classes/donjara-tile-scanner/donjara-tile-scanner';
import { CgUnit } from './cg-unit';

/**
 * 牌のインタフェース
 */
export interface CgDonjaraTile extends DonjaraTileScannerResultItem {
  // 牌の画像
  imageUrl?: string;
}

/**
 * 手牌のインタフェース
 */
export interface CgDonjaraHoldTile extends CgDonjaraTile {
  // 牌のグルーピング
  suggestedGroup?: CgDonjaraHoldTileGroup;
}

/**
 * 手牌のインタフェース
 */
export interface CgDonjaraUnitTile extends CgDonjaraTile {
  // 手牌に含まれるか
  isHold: boolean;
}

export interface CgDonjaraHoldTileGroup {
  // ラベル (A〜Z)
  groupingLabel: string;
  // 色
  groupingColor: string;
  // ユニット
  unit: CgUnit;
}
