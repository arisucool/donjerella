import { CgDonjaraUnitTile } from './cg-donjara-tile';

export interface CgUnit {
  // ユニット名
  label: string;
  // メンバーの人数
  numOfMembers: number;
  // メンバーの牌
  tileIdentifiers?: string[];
  tiles?: CgDonjaraUnitTile[];
  // 手牌に含まれるメンバーの数
  numOfHoldTiles?: number;
  // 収録情報
  listed: {
    // ユニットガイドブックに収録されているか
    unitGuideBook?: boolean;
    // デレステに楽曲があるか
    songOnStarlightStage?: boolean;
    // デレステで名前が収録されているか
    nameOnStarlightStage?: boolean;
  };
}

export interface CgUnitDefinition extends CgUnit {}
