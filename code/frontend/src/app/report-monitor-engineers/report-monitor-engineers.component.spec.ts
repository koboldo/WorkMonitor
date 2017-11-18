import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMonitorEngineersComponent } from './report-monitor-engineers.component';

describe('ReportMonitorEngineersComponent', () => {
  let component: ReportMonitorEngineersComponent;
  let fixture: ComponentFixture<ReportMonitorEngineersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportMonitorEngineersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportMonitorEngineersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
