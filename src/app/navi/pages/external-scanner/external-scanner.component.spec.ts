import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalScannerComponent } from './external-scanner.component';

describe('ExternalScannerComponent', () => {
  let component: ExternalScannerComponent;
  let fixture: ComponentFixture<ExternalScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExternalScannerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
