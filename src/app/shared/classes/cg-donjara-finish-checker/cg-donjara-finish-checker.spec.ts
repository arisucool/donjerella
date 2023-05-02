import { CgDonjaraFinishChecker } from './cg-donjara-finish-checker';

describe('CgDonjaraFinishChecker', () => {
  let finishChecker: CgDonjaraFinishChecker;

  beforeEach(() => {
    finishChecker = new CgDonjaraFinishChecker({
      isDebug: false,
      tiles: [
        {
          identifier: '001',
          label: '島村卯月',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'visual',
        },
        {
          identifier: '003',
          label: '水本ゆかり',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'vocal',
        },
        {
          identifier: '011',
          label: '小日向美穂',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'dance',
        },
        {
          identifier: '013',
          label: '五十嵐響子',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'vocal',
        },
        {
          identifier: '087',
          label: '橘ありす',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'visual',
        },
        {
          identifier: '015',
          label: '櫻井桃華',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'dance',
        },
        {
          identifier: '024',
          label: '遊佐こずえ',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'visual',
        },
        {
          identifier: '026',
          label: '一ノ瀬志希',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'vocal',
        },
        {
          identifier: '034',
          label: '双葉杏',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'dance',
        },
        {
          identifier: '060',
          label: '乙倉悠貴',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'vocal',
        },
        {
          identifier: '064',
          label: '黒埼ちとせ',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cute',
          idolStatus: 'vocal',
        },
        {
          identifier: '088',
          label: '鷺沢文香',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'dance',
        },
        {
          identifier: '096',
          label: '高垣楓',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'dance',
        },
        {
          identifier: '104',
          label: '佐城雪美',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'visual',
        },
        {
          identifier: '122',
          label: 'アナスタシア',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'visual',
        },
        {
          identifier: '124',
          label: '結城晴',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'dance',
        },
        {
          identifier: '130',
          label: '久川颯',
          imageUrl: '',
          pack: 'initial',
          idolType: 'cool',
          idolStatus: 'dance',
        },
        {
          identifier: '140',
          label: '赤城みりあ',
          imageUrl: '',
          pack: 'initial',
          idolType: 'passion',
          idolStatus: 'dance',
        },
        {
          identifier: '144',
          label: '姫川友紀',
          imageUrl: '',
          pack: 'initial',
          idolType: 'passion',
          idolStatus: 'visual',
        },
        {
          identifier: '155',
          label: '的場梨沙',
          imageUrl: '',
          pack: 'initial',
          idolType: 'passion',
          idolStatus: 'vocal',
        },
        {
          identifier: '163',
          label: '城ヶ崎莉嘉',
          imageUrl: '',
          pack: 'initial',
          idolType: 'passion',
          idolStatus: 'visual',
        },
        {
          identifier: '166',
          label: '諸星きらり',
          imageUrl: '',
          pack: 'initial',
          idolType: 'passion',
          idolStatus: 'vocal',
        },
      ],
      units: [
        {
          label: 'P.C.S.',
          numOfMembers: 3,
          tileIdentifiers: ['001', '011', '013'], // 島村卯月、小日向美穂、五十嵐響子
        },
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
        {
          label: 'トランクィル・ウィスパー',
          numOfMembers: 3,
          tileIdentifiers: ['088', '096', '122'], // 鷺沢文香、高垣楓、アナスタシア
        },
        {
          label: '凸レーション',
          numOfMembers: 3,
          tileIdentifiers: ['140', '163', '166'], // 赤城みりあ、城ヶ崎莉嘉、諸星きらり
        },
        {
          label: 'fleeting bouquet',
          numOfMembers: 3,
          tileIdentifiers: ['124', '026', '064'], // 結城晴、一ノ瀬志希、黒埼ちとせ
        },
        {
          label: 'Love Yell',
          numOfMembers: 5,
          // 乙倉悠貴、諸星きらり、五十嵐響子、姫川友紀、水本ゆかり
          tileIdentifiers: ['060', '166', '013', '144', '003'],
        },
      ],
    });
  });

  it('初期化', () => {
    expect(finishChecker).toBeTruthy();
  });

  it('5スター - 5人公式 + 2人公式 + 2人(Co-Da)', () => {
    expect(
      finishChecker.checkFinish([
        // Love Yell
        '060', // 乙倉悠貴
        '166', // 諸星きらり
        '013', // 五十嵐響子
        '144', // 姫川友紀
        '003', // 水本ゆかり
        // ビートシューター
        '124', // 結城晴
        '155', // 的場梨沙
        // 2人(Co-Da)
        '088', // 鷺沢文香
        '096', // 高垣楓
      ])
    ).toMatchObject([
      {
        name: '5スター',
        score: 360000,
        units: expect.arrayContaining([
          expect.objectContaining({
            label: 'Love Yell',
          }),
          expect.objectContaining({
            label: 'ビートシューター',
          }),
          expect.objectContaining({
            label: '汎用cooldance',
          }),
        ]),
      },
    ]);
  });

  it('トリコロール - 3人公式(Cu) + 3人公式(Co) + 3人公式(Pa)', () => {
    expect(
      finishChecker.checkFinish([
        // P.C.S. (Cu)
        '001', // 島村卯月
        '011', // 小日向美穂
        '013', // 五十嵐響子
        // トランクィル・ウィスパー (Co)
        '088', // 鷺沢文香
        '096', // 高垣楓
        '122', // アナスタシア
        // 凸レーション (Pa)
        '140', // 赤城みりあ
        '163', // 城ヶ崎莉嘉
        '166', // 諸星きらり
      ])
    ).toMatchObject([
      {
        name: 'トリコロール',
        score: 240000,
        units: expect.arrayContaining([
          expect.objectContaining({
            label: 'P.C.S.',
          }),
          expect.objectContaining({
            label: 'トランクィル・ウィスパー',
          }),
          expect.objectContaining({
            label: '凸レーション',
          }),
        ]),
      },
    ]);
  });

  it('スタートダッシュライブ - 3人公式 + 2人公式 + 2人(Co-Vi) + 2人(Cu-Da)', () => {
    expect(
      finishChecker.checkFinish([
        // ももぺあべりー
        '087', // 橘ありす
        '015', // 櫻井桃華
        '155', // 的場梨沙
        // Sora-iris
        '060', // 乙倉悠貴
        '130', // 久川颯
        // 2人(Co-Vi)
        '104', // 佐城雪美
        '122', // アナスタシア
        // 2人(Cu-Da)
        '011', // 小日向美穂
        '034', // 双葉杏
      ])
    ).toMatchObject([
      {
        name: 'スタートダッシュ',
        score: 60000,
        units: expect.arrayContaining([
          expect.objectContaining({
            label: 'ももぺあべりー',
          }),
          expect.objectContaining({
            label: 'Sola-iris',
          }),
          expect.objectContaining({
            label: '汎用coolvisual',
          }),
          expect.objectContaining({
            label: '汎用cutedance',
          }),
        ]),
      },
    ]);
  });

  it('ノーマルライブ - 3人公式 + 3人公式 + 3人(Co-Da)', () => {
    expect(
      finishChecker.checkFinish([
        // ももぺあべりー
        '087', // 橘ありす
        '015', // 櫻井桃華
        '155', // 的場梨沙
        // プチ＊パフェアリー
        '024', // 遊佐こずえ
        '034', // 双葉杏
        '104', // 佐城雪美
        // 3人(Co-Da)
        '124', // 結城晴
        '130', // 久川颯
        '088', // 鷺沢文香
      ])
    ).toMatchObject([
      {
        name: 'ノーマルライブ',
        score: 120000,
        units: expect.arrayContaining([
          expect.objectContaining({
            label: 'プチ＊パフェアリー',
          }),
          expect.objectContaining({
            label: 'ももぺあべりー',
          }),
          expect.objectContaining({
            label: '汎用cooldance',
          }),
        ]),
      },
    ]);
  });

  it('ノーマルライブ - 3人公式 + 3人公式 + 3人公式', () => {
    expect(
      finishChecker.checkFinish([
        // ももぺあべりー
        '087', // 橘ありす
        '015', // 櫻井桃華
        '155', // 的場梨沙
        // プチ＊パフェアリー
        '024', // 遊佐こずえ
        '034', // 双葉杏
        '104', // 佐城雪美
        // fleeting bouquet
        '124', // 結城晴
        '026', // 一ノ瀬志希
        '064', // 黒埼ちとせ
      ])
    ).toMatchObject([
      {
        name: 'ノーマルライブ',
        score: 120000,
        units: expect.arrayContaining([
          expect.objectContaining({
            label: 'プチ＊パフェアリー',
          }),
          expect.objectContaining({
            label: 'ももぺあべりー',
          }),
          expect.objectContaining({
            label: 'fleeting bouquet',
          }),
        ]),
      },
    ]);
  });

  it('不成立 - 3人公式 + 3人公式 + 2人(Co-Da) + 1人(Pa-Da)', () => {
    expect(
      finishChecker.checkFinish([
        // ももぺあべりー
        '087', // 橘ありす
        '015', // 櫻井桃華
        '155', // 的場梨沙
        // プチ＊パフェアリー
        '024', // 遊佐こずえ
        '034', // 双葉杏
        '104', // 佐城雪美
        // 2人(Co-Da)
        '088', // 鷺沢文香
        '130', // 久川颯
        // 1人(Pa-Da)
        '140', // 赤城みりあ
      ])
    ).toBe(undefined);
  });

  it('不成立 - 3人公式 + 3人公式 + 2人(Co-Da) (計8人しかいないため)', () => {
    expect(
      finishChecker.checkFinish([
        // ももぺあべりー
        '087', // 橘ありす
        '015', // 櫻井桃華
        '155', // 的場梨沙
        // プチ＊パフェアリー
        '024', // 遊佐こずえ
        '034', // 双葉杏
        '104', // 佐城雪美
        // 2人(Co-Da)
        '130', // 久川颯
        '088', // 鷺沢文香
      ])
    ).toBe(undefined);
  });
});
