import { DonjaraTileScannerResultItem } from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';

export interface CgDonjaraTile extends DonjaraTileScannerResultItem {
  // 牌の画像
  imageUrl?: string;
  // 手牌に含まれるか
  isHold?: boolean;
}
