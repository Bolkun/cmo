import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashMessageComponent } from './flash-message.component';

describe('FlashMessageComponent', () => {
  let component: FlashMessageComponent;
  let fixture: ComponentFixture<FlashMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FlashMessageComponent]
    });
    fixture = TestBed.createComponent(FlashMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
