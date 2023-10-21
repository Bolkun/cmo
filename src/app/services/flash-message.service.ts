import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface FlashMessage {
  message: string;
  cssClass: 'warning' | 'info' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class FlashMessageService {
  private messageSubject = new BehaviorSubject<FlashMessage | null>(null);
  message$ = this.messageSubject.asObservable();

  showMessage(
    message: string,
    cssClass: 'warning' | 'info' | 'error' = 'info'
  ): void {
    this.messageSubject.next({ message, cssClass });
    setTimeout(() => this.messageSubject.next(null), 5000); // auto-hide after 5 seconds
  }
}
