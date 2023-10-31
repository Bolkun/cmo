import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPresenceComponent } from './user-presence.component';

describe('UserPresenceComponent', () => {
  let component: UserPresenceComponent;
  let fixture: ComponentFixture<UserPresenceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserPresenceComponent]
    });
    fixture = TestBed.createComponent(UserPresenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
