import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerRequestComponent } from './timer-request.component';

describe('TimerRequestComponent', () => {
  let component: TimerRequestComponent;
  let fixture: ComponentFixture<TimerRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TimerRequestComponent]
    });
    fixture = TestBed.createComponent(TimerRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
