import { CgDonjaraTile } from 'src/app/shared/interfaces/cg-donjara-tile';
import { CgUnit } from 'src/app/shared/interfaces/cg-unit';

export interface CgDonjaraFinishCheckerResult {
  name: string;
  score: number;
  units: CgUnit[];
}

export class CgDonjaraFinishChecker {
  private isDebug: boolean;
  private units: CgUnit[];
  private idols: CgDonjaraTile[];

  constructor(params: {
    isDebug: boolean;
    units: CgUnit[];
    tiles: CgDonjaraTile[];
  }) {
    this.isDebug = params.isDebug ?? false;
    this.units = params.units;
    this.idols = params.tiles;
  }

  public checkFinish(tileIdentifiers: Array<string>) {
    // TODO: 重複チェックで同じアイドルが2人入ってきたらエラーみたいなの返す？

    if (tileIdentifiers.length !== 9) {
      // 9人でない場合は不成立
      return undefined;
    }

    let result;
    if ((result = this.checkCinderellaGirls(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkWonderfulMagic(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkEnsemble(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkFiveStar(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkQuartet(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkSymphony(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkTricolor(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkNormalLive(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkStartDash(tileIdentifiers))) {
      return result;
    } else if ((result = this.checkRehearsal(tileIdentifiers))) {
      return result;
    }
    return undefined;
  }

  // 60 シンデレラガールズ 特定9人（10人中）
  private checkCinderellaGirls(tiles: Array<string>) {
    const unit = {
      label: 'シンデレラガール',
      tileIdentifiers: [
        '167',
        '097',
        '066',
        '115',
        '001',
        '096',
        '050',
        '131',
        '100',
        '088',
      ],
    };
    if (tiles.every((tile) => unit.tileIdentifiers.find((id) => id === tile))) {
      return [
        {
          name: 'シンデレラガール',
          score: 600000,
          units: [{ name: 'シンデレラガール', ids: tiles }],
        },
      ];
    } else {
      return false;
    }
  }

  // 48 WONDERFUL_M@GIC 特定9人（19人中）
  private checkWonderfulMagic(tiles: Array<string>) {
    const unit = {
      label: 'WONDERFUL M@GIC!!',
      tileIdentifiers: [
        '001',
        '066',
        '131',
        '140',
        '122',
        '050',
        '097',
        '011',
        '162',
        '163',
        '109',
        '096',
        '077',
        '084',
        '165',
        '034',
        '027',
        '008',
        '166',
      ],
    };
    if (tiles.every((tile) => unit.tileIdentifiers.find((id) => id === tile))) {
      return [
        {
          name: 'WONDERFUL M@GIC!!',
          score: 480000,
          units: [{ name: 'WONDERFUL M@GIC!!', ids: tiles }],
        },
      ];
    } else {
      return false;
    }
  }

  // 42 アンサンブル タイプもステータスも同じ9枚
  private checkEnsemble(tiles: Array<string>) {
    const idols = this.idols.filter((idol) =>
      tiles.find((tile) => tile === idol.identifier)
    );
    if (
      idols.every(
        (idol) =>
          idol.idolType === idols[0].idolType &&
          idol.idolStatus === idols[0].idolStatus
      )
    ) {
      return [
        {
          name: 'アンサンブル',
          score: 420000,
          units: [{ name: 'アンサンブル', ids: tiles }],
        },
      ];
    } else {
      return false;
    }
  }

  // 36 5スター 5人ユニット+2個セットx2
  private checkFiveStar(tiles: Array<string>) {
    const units1 = this.units.filter((unit) => unit.numOfMembers === 5);
    if (!units1.length) return false;
    const results: Array<CgDonjaraFinishCheckerResult> = [];
    for (const unit1 of units1) {
      if (
        !unit1.tileIdentifiers.every((id) => tiles.find((tile) => tile === id))
      )
        continue;
      const remainingTiles1 = tiles.filter(
        (tile) => !unit1.tileIdentifiers.find((id) => id === tile)
      );
      for (let i = 0; i < remainingTiles1.length - 1; i++) {
        for (let j = i + 1; j < remainingTiles1.length; j++) {
          let unit2: CgUnit | undefined;
          if (
            (unit2 = this.getMatchedUnit([
              remainingTiles1[i],
              remainingTiles1[j],
            ]))
          ) {
            const remainingTiles2 = remainingTiles1.filter(
              (tile) => !unit2!.tileIdentifiers.find((id) => id === tile)
            );
            let unit3;
            if ((unit3 = this.getMatchedUnit(remainingTiles2))) {
              results.push({
                name: '5スター',
                score: 360000,
                units: [unit1, unit2, unit3],
              });
            }
          }
        }
      }
    }
    return results.length ? this.uniqueResults(results) : false;
  }

  // 36 カルテット 4人ユニット+3個セット+2個セット
  private checkQuartet(tiles: Array<string>) {
    const units1 = this.units.filter((unit) => unit.numOfMembers === 4);
    if (!units1.length) return false;
    const results: Array<CgDonjaraFinishCheckerResult> = [];
    for (const unit1 of units1) {
      if (
        !unit1.tileIdentifiers.every((id) => tiles.find((tile) => tile === id))
      )
        continue;
      const remainingTiles1 = tiles.filter(
        (tile) => !unit1.tileIdentifiers.find((id) => id === tile)
      );
      for (let i = 0; i < remainingTiles1.length - 1; i++) {
        for (let j = i + 1; j < remainingTiles1.length; j++) {
          let unit2: CgUnit | undefined;
          if (
            (unit2 = this.getMatchedUnit([
              remainingTiles1[i],
              remainingTiles1[j],
            ]))
          ) {
            const remainingTiles2 = remainingTiles1.filter(
              (tile) => !unit2!.tileIdentifiers.find((id) => id === tile)
            );
            let unit3;
            if ((unit3 = this.getMatchedUnit(remainingTiles2))) {
              results.push({
                name: 'カルテット',
                score: 420000,
                units: [unit1, unit3, unit2],
              });
            }
          }
        }
      }
    }
    return results.length ? this.uniqueResults(results) : false;
  }

  // 24 シンフォニー タイプは全て同じだがステータスは3,3,3にすれば異なっても良い
  private checkSymphony(tiles: Array<string>) {
    const idols = this.idols.filter((idol) =>
      tiles.find((tile) => tile === idol.identifier)
    );
    if (
      idols.filter((idol) => idol.idolStatus === 'dance').length % 3 === 0 &&
      idols.filter((idol) => idol.idolStatus === 'visual').length % 3 === 0 &&
      idols.filter((idol) => idol.idolStatus === 'vocal').length % 3 === 0 &&
      idols.every((idol) => idol.idolType === idols[0].idolType)
    ) {
      return [
        {
          name: 'シンフォニー',
          score: 240000,
          units: [{ name: 'シンフォニー', ids: tiles }], // TODO: ユニット出したいなあ
        },
      ];
    } else {
      return false;
    }
  }

  // 24 トリコロール 3人ユニットx3
  private checkTricolor(tiles: Array<string>) {
    const units1 = this.units.filter((unit) => unit.numOfMembers === 3);
    if (!units1.length) return false;
    const results: Array<CgDonjaraFinishCheckerResult> = [];
    for (const unit1 of units1) {
      if (
        !unit1.tileIdentifiers.every((id) => tiles.find((tile) => tile === id))
      )
        continue;
      const remainingTiles1 = tiles.filter(
        (tile) => !unit1.tileIdentifiers.find((id) => id === tile)
      );
      for (const unit2 of units1) {
        if (
          !unit2.tileIdentifiers.every((id) =>
            remainingTiles1.find((tile) => tile === id)
          )
        )
          continue;
        const remainingTiles2 = remainingTiles1.filter(
          (tile) => !unit2.tileIdentifiers.find((id) => id === tile)
        );
        for (const unit3 of units1) {
          if (
            !unit3.tileIdentifiers.every((id) =>
              remainingTiles2.find((tile) => tile === id)
            )
          )
            continue;
          results.push({
            name: 'トリコロール',
            score: 240000,
            units: [unit1, unit2, unit3],
          });
        }
      }
    }
    return results.length ? this.uniqueResults(results) : false;
  }

  // 12 ノーマルライブ 3人ユニット+3個セットx2
  private checkNormalLive(tiles: Array<string>) {
    const units1 = this.units.filter((unit) => unit.numOfMembers === 3);
    if (!units1.length) return false;
    const results: Array<CgDonjaraFinishCheckerResult> = [];
    for (const unit1 of units1) {
      if (
        !unit1.tileIdentifiers.every((id) => tiles.find((tile) => tile === id))
      )
        continue;
      const remainingTiles1 = tiles.filter(
        (tile) => !unit1.tileIdentifiers.find((id) => id === tile)
      );
      for (let i = 0; i < remainingTiles1.length - 2; i++) {
        for (let j = i + 1; j < remainingTiles1.length - 1; j++) {
          for (let k = j + 1; k < remainingTiles1.length; k++) {
            let unit2: CgUnit | undefined;
            if (
              (unit2 = this.getMatchedUnit([
                remainingTiles1[i],
                remainingTiles1[j],
                remainingTiles1[k],
              ]))
            ) {
              const remainingTiles2 = remainingTiles1.filter(
                (tile) => !unit2!.tileIdentifiers.find((id) => id === tile)
              );
              let unit3: CgUnit | undefined;
              if ((unit3 = this.getMatchedUnit(remainingTiles2))) {
                results.push({
                  name: 'ノーマルライブ',
                  score: 120000,
                  units: [unit1, unit3, unit2],
                });
              }
            }
          }
        }
      }
    }
    return results.length ? this.uniqueResults(results) : false;
  }

  // 6 スタートダッシュ 3人ユニット+2人ユニット+2個セットx2
  private checkStartDash(tiles: Array<string>) {
    const units1 = this.units.filter((unit) => unit.numOfMembers === 3);
    if (!units1.length) return false;
    const results: Array<CgDonjaraFinishCheckerResult> = [];
    for (const unit1 of units1) {
      if (
        !unit1.tileIdentifiers.every((id) => tiles.find((tile) => tile === id))
      )
        continue;
      const remainingTiles1 = tiles.filter(
        (tile) => !unit1.tileIdentifiers.find((id) => id === tile)
      );
      const units2 = this.units.filter((unit) => unit.numOfMembers === 2);
      if (!units2.length) return false;
      for (const unit2 of units2) {
        if (
          !unit2.tileIdentifiers.every((id) =>
            remainingTiles1.find((tile) => tile === id)
          )
        )
          continue;
        const remainingTiles2 = remainingTiles1.filter(
          (tile) => !unit2.tileIdentifiers.find((id) => id === tile)
        );
        for (let i = 0; i < remainingTiles2.length - 1; i++) {
          for (let j = i + 1; j < remainingTiles2.length; j++) {
            let unit3: CgUnit | undefined;
            if (
              (unit3 = this.getMatchedUnit([
                remainingTiles2[i],
                remainingTiles2[j],
              ]))
            ) {
              const remainingTiles3 = remainingTiles2.filter(
                (tile) => !unit3!.tileIdentifiers.find((id) => id === tile)
              );
              let unit4: CgUnit | undefined;
              if ((unit4 = this.getMatchedUnit(remainingTiles3))) {
                results.push({
                  name: 'スタートダッシュ',
                  score: 60000,
                  units: [unit1, unit2, unit3, unit4],
                });
              }
            }
          }
        }
      }
    }
    return results.length ? this.uniqueResults(results) : false;
  }

  // 3 リハーサル タイプは異なっても良くステータスが3,3,3になっている
  private checkRehearsal(tiles: Array<string>) {
    const idols = this.idols.filter((idol) =>
      tiles.find((tile) => tile === idol.identifier)
    );
    for (const type of ['cute', 'cool', 'passion']) {
      for (const status of ['visual', 'vocal', 'dance']) {
        if (
          idols.filter(
            (idol) => idol.idolType === type && idol.idolStatus === status
          ).length %
            3 !==
          0
        )
          return false;
      }
    }
    return [
      {
        name: 'リハーサル',
        score: 30000,
        units: [{ name: 'リハーサル', ids: tiles }], // TODO: ユニット出したいなあ
      },
    ];
  }

  // 何らかのユニットに完全一致するか
  private getMatchedUnit(tiles: Array<string>): CgUnit | undefined {
    let unit: CgUnit | undefined;
    if (
      (unit = this.units
        .filter((unit) => unit.numOfMembers === tiles.length)
        .find((unit) =>
          tiles.every((tile) => unit.tileIdentifiers.find((id) => tile === id))
        ))
    ) {
      return {
        label: unit.label,
        tileIdentifiers: tiles,
        numOfMembers: unit.numOfMembers,
      };
    }
    const idols = this.idols.filter((idol) =>
      tiles.find((tile) => tile === idol.identifier)
    );
    if (
      idols.every(
        (idol) =>
          idol.idolType === idols[0].idolType &&
          idol.idolStatus === idols[0].idolStatus
      )
    ) {
      return {
        label: `汎用${idols[0].idolType}${idols[0].idolStatus}`,
        tileIdentifiers: tiles,
        numOfMembers: tiles.length,
      };
    }
    return undefined;
  }

  // 重複する結果を削除
  private uniqueResults(results: CgDonjaraFinishCheckerResult[]) {
    return results
      .filter(
        (result1, i) =>
          results.findIndex(
            (result2) =>
              result1.units
                .sort((a, b) => a.label.localeCompare(b.label))
                .flatMap((unit) => unit.tileIdentifiers)
                .join() ===
              result2.units
                .sort((a, b) => a.label.localeCompare(b.label))
                .flatMap((unit) => unit.tileIdentifiers)
                .join()
          ) === i
      )
      .map((result) => {
        result.units.sort((a, b) => b.numOfMembers - a.numOfMembers);
        return result;
      });
  }
}
