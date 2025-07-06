import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { PresenceService } from 'src/app/services/presence.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent {

  constructor(
    private userService: UserService,
    private presenceService: PresenceService
  ) {}

  logout() {
    this.presenceService.signOut();
    this.userService.signOut();
  }
}
