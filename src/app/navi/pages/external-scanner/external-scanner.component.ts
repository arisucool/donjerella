import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DonjaraTileScannerResult,
  DonjaraTileScannerResultItem,
} from 'src/app/shared/classes/donjara-tile-classifier/donjara-tile-scanner';

@Component({
  selector: 'app-external-scanner',
  templateUrl: './external-scanner.component.html',
  styleUrls: ['./external-scanner.component.scss'],
})
export class ExternalScannerComponent implements OnInit {
  public isParentChecked: boolean | undefined = undefined;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    // 呼出元の確認
    this.isParentChecked = !this.checkParent();
  }

  onScanned(event: DonjaraTileScannerResult) {
    console.log(`[ExternalScannerComponent] onScanned`, event);
    this.sendMessageToParent('SCANNED', event);
  }

  onScannerDismissed() {
    console.log(`[ExternalScannerComponent] onScannerDismissed`);
    this.sendMessageToParent('CANCELED');
  }

  private checkParent() {
    if (!document.referrer || !window.parent) {
      return false;
    }
    console.log(`[ExternalScannerComponent] checkParent`, {
      referrer: document.referrer,
    });
    return true;
  }

  private sendMessageToParent(type: string, data?: any) {
    window.parent.postMessage({
      app: 'cgDonjaraScanner',
      type: type,
      ...data,
    });
  }
}
