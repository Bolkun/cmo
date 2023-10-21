import { Component } from '@angular/core';
import { FlashMessageService } from 'src/app/services/flash-message.service';

@Component({
  selector: 'app-flash-message',
  templateUrl: './flash-message.component.html',
  styleUrls: ['./flash-message.component.css'],
})
export class FlashMessageComponent {
  messageData$ = this.flashMessageService.message$;

  constructor(private flashMessageService: FlashMessageService) {}
}
