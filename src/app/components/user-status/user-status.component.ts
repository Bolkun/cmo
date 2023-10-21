import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { PresenceService } from 'src/app/services/presence.service';

@Component({
  selector: 'app-user-status',
  templateUrl: './user-status.component.html',
  styleUrls: ['./user-status.component.css']
})
export class UserStatusComponent implements OnInit {

  @Input() uid;
  presence$;

  constructor(private presence: PresenceService) {}

  ngOnInit(): void {
    this.presence$ = this.presence.getPresence(this.uid);
  }

  get typedPresence$(): Observable<any> {
    return this.presence$ as Observable<any>;
  }

  getPresenceClass(presence: any): { [key: string]: boolean } {
    return {
      'is-success': presence.status === 'online',
      'is-warning': presence.status === 'away',
      'is-danger': presence.status === 'offline'
    };
  }
}
