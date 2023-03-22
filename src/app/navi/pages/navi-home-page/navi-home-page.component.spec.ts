import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NaviHomePageComponent } from './navi-home-page.component';

describe('NaviHomePageComponent', () => {
  let component: NaviHomePageComponent;
  let fixture: ComponentFixture<NaviHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NaviHomePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NaviHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
