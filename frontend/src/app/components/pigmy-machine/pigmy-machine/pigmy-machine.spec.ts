import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PigmyMachine } from './pigmy-machine';

describe('PigmyMachine', () => {
  let component: PigmyMachine;
  let fixture: ComponentFixture<PigmyMachine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PigmyMachine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PigmyMachine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
