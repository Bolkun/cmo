import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { PresenceService } from 'src/app/services/presence.service';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.component.html',
  styleUrls: ['./user-status.component.css']
})
export class UserStatusComponent implements OnInit {

  @Input() id;
  presence$;

  constructor(private presence: PresenceService) {}

  ngOnInit(): void {
    this.presence$ = this.presence.getPresence(this.id);
  }

  get typedPresence$(): Observable<any> {
    return this.presence$ as Observable<any>;
  }

  getPresenceClass(presence: any): string {
    switch (presence.status) {
      case 'online':
        return 'status-online';
      case 'away':
        return 'status-away';
      case 'offline':
      default:
        return 'status-offline';
    }
  }
}
