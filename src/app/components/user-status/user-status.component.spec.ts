import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserStatusComponent } from './user-status.component';

describe('UserStatusComponent', () => {
  let component: UserStatusComponent;
  let fixture: ComponentFixture<UserStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserStatusComponent]
    });
    fixture = TestBed.createComponent(UserStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
