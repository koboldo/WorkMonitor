import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WoComponent } from './wo.component';

describe('WoComponent', () => {
  let component: WoComponent;
  let fixture: ComponentFixture<WoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
