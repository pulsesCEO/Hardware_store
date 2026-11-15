import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportData } from './export-data';

describe('ExportData', () => {
  let component: ExportData;
  let fixture: ComponentFixture<ExportData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
