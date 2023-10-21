import { Injectable } from '@angular/core';
import { timer as observableTimer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  timer: number = 30;
  gameEnded: boolean = false;

  constructor() { }

  startTimer(): void {
    // this.http.post(this.startTimerUrl, {}).subscribe(response => {
    //   observableTimer(0, 1000).pipe(
    //     switchMap(() => this.http.get(this.timerUrl))
    //   ).subscribe((data: any) => {
    //     this.timer = data.timer;
    //     if (this.timer <= 0) {
    //       this.gameEnded = true;
    //       alert("Time's up!");
    //     }
    //   });
    // });
  }
}
