import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CgDonjaraTile } from '../../../shared/interfaces/cg-donjara-tile';
import { TileDatabaseService } from '../../services/tile-database.service';

@Component({
  selector: 'app-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss'],
})
export class TileSelectorComponent {
  // 推奨する牌
  @Input()
  recommendedTiles: CgDonjaraTile[] | undefined;

  // 除外する牌
  @Input()
  excludeTiles: CgDonjaraTile[] | undefined;

  // イベント
  @Output('onSelectTile')
  onSelectedTile = new EventEmitter<CgDonjaraTile>();

  // アイドルの属性
  requestedType: 'cute' | 'cool' | 'passion' | undefined;

  // 表示される牌の配列
  tiles: CgDonjaraTile[] = [];

  constructor(private tileDatabaseService: TileDatabaseService) {}

  async ngOnInit() {}

  async loadTiles() {
    let tiles = await this.tileDatabaseService.getTiles();
    tiles = tiles.filter((t) => {
      if (t.idolStatus === 'almighty') return false;

      if (
        this.excludeTiles &&
        this.excludeTiles.find((t_) => t.identifier === t_.identifier)
      )
        return false;

      return t.idolType === this.requestedType;
    });

    tiles = tiles.sort((a, b) => {
      const strA = a.idolYomi || a.label;
      const strB = b.idolYomi || b.label;
      return strA.localeCompare(strB);
    });

    this.tiles = tiles;
  }

  onSelectType(type: 'cute' | 'cool' | 'passion') {
    this.requestedType = type;
    this.loadTiles();
  }

  onSelectTile(tile: CgDonjaraTile) {
    this.onSelectedTile.emit(tile);
  }
}
