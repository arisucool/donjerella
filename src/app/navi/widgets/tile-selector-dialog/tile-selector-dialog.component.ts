import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CgDonjaraTile } from '../../../shared/interfaces/cg-donjara-tile';

export interface TileSelectorDialogData {
  title: string;
  recommendedTiles?: CgDonjaraTile[];
  excludeTiles?: CgDonjaraTile[];
}

@Component({
  selector: 'app-tile-selector-dialog',
  templateUrl: './tile-selector-dialog.component.html',
  styleUrls: ['./tile-selector-dialog.component.scss'],
})
export class TileSelectorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TileSelectorDialogData,
    private dialogRef: MatDialogRef<TileSelectorDialogComponent>
  ) {}

  onSelectTile(tile: CgDonjaraTile) {
    this.dialogRef.close(tile);
  }
}
