import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NaviService } from './navi.service';
import { ScannerService } from './scanner.service';
import { TileDatabaseService } from './tile-database.service';

describe('NaviService', () => {
  let tileDatabaseService: TileDatabaseService;
  let naviService: NaviService;
  let scannerService: ScannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TileDatabaseService,
        },
      ],
      imports: [HttpClientTestingModule],
    });

    tileDatabaseService = TestBed.inject(TileDatabaseService);
    naviService = TestBed.inject(NaviService);
    scannerService = TestBed.inject(ScannerService);

    // モックを設定 - ユニットデータベース
    jest.spyOn(tileDatabaseService, 'fetchUnits').mockReturnValue(
      Promise.resolve([
        {
          label: 'ももぺあべりー',
          numOfMembers: 3,
          tileIdentifiers: ['087', '015', '155'], // 橘ありす、櫻井桃華、的場梨沙
          listed: {},
        },
        {
          label: 'プチ＊パフェアリー',
          numOfMembers: 3,
          tileIdentifiers: ['024', '034', '104'], // 遊佐こずえ、双葉杏、佐城雪美
          listed: {},
        },
        {
          label: 'ビートシューター',
          numOfMembers: 2,
          tileIdentifiers: ['124', '155'], // 結城晴、的場梨沙
          listed: {},
        },
        {
          label: 'Sola-iris',
          numOfMembers: 2,
          tileIdentifiers: ['060', '130'], // 乙倉悠貴、久川颯
        },
      ])
    );

    // モックを設定 - 牌データベース
    jest.spyOn(tileDatabaseService, 'fetchTiles').mockReturnValue(
      Promise.resolve([
        {
          identifier: '087',
          label: '橘ありす',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '015',
          label: '櫻井桃華',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '024',
          label: '遊佐こずえ',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '034',
          label: '双葉杏',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '060',
          label: '乙倉悠貴',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '104',
          label: '佐城雪美',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '124',
          label: '結城晴',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '130',
          label: '久川颯',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '140',
          label: '赤城みりあ',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
        {
          identifier: '155',
          label: '的場梨沙',
          imageUrl: '',
          pack: 'initial',
          score: -1,
        },
      ])
    );
  });

  it('初期化', () => {
    expect(naviService).toBeTruthy();
  });

  it('サンプル手牌の取得', async () => {
    const cgTiles = await scannerService.getCgTilesByScannerResult(
      await scannerService.getExampleResult()
    );

    expect(cgTiles.length).toEqual(8);
    expect(cgTiles[0]).toEqual(
      expect.objectContaining({
        label: '橘ありす',
      })
    );
  });

  it('手牌のグルーピング', async () => {
    // サンプルの手牌を読み取る
    const cgTiles = await scannerService.getCgTilesByScannerResult(
      await scannerService.getExampleResult()
    );

    // 手牌をグルーピング
    const holdTiles = await naviService.groupingHoldTiles(cgTiles);

    // グルーピング結果を検証 - ももぺあべりー
    expect(holdTiles[0]).toMatchObject({
      label: '橘ありす',
      suggestedGroup: {
        groupingLabel: 'A',
        unit: {
          label: 'ももぺあべりー',
        },
      },
    });
    expect(holdTiles[1]).toMatchObject({
      label: '櫻井桃華',
      suggestedGroup: {
        groupingLabel: 'A',
        unit: {
          label: 'ももぺあべりー',
        },
      },
    });
    expect(holdTiles[2]).toMatchObject({
      label: '的場梨沙',
      suggestedGroup: {
        groupingLabel: 'A',
        unit: {
          label: 'ももぺあべりー',
        },
      },
    });

    // グルーピング結果を検証 - プチ＊パフェアリー
    expect(holdTiles[3]).toMatchObject({
      label: '佐城雪美',
      suggestedGroup: {
        groupingLabel: 'B',
        unit: {
          label: 'プチ＊パフェアリー',
        },
      },
    });
    expect(holdTiles[6]).toMatchObject({
      label: '遊佐こずえ',
      suggestedGroup: {
        groupingLabel: 'B',
        unit: {
          label: 'プチ＊パフェアリー',
        },
      },
    });

    // グルーピング結果を検証 - 未グルーピング
    expect(holdTiles[4]).toMatchObject({
      label: '結城晴',
      suggestedGroup: undefined, // 結城晴は "ビートシューター" に含まれるが、的場梨沙がすでに "ももぺあべりー" で使われているため、グルーピングされない
    });
    expect(holdTiles[5]).toMatchObject({
      label: '赤城みりあ',
      suggestedGroup: undefined,
    });
    expect(holdTiles[7]).toMatchObject({
      label: '乙倉悠貴',
      suggestedGroup: undefined, // 乙倉悠貴は "Sola-iris" に含まれるが、他のアイドルが一人も手牌に含まれていないため、グルーピングされない
    });
  });
});
