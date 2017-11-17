import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportUnacceptedOrdersComponent } from './report-unaccepted-orders.component';

describe('ReportUnacceptedOrdersComponent', () => {
  let component: ReportUnacceptedOrdersComponent;
  let fixture: ComponentFixture<ReportUnacceptedOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportUnacceptedOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportUnacceptedOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
