import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-timer-game',
  templateUrl: './timer-game.component.html',
  styleUrls: ['./timer-game.component.css']
})
export class TimerGameComponent implements OnInit, OnDestroy {
  @Input() startTime: number;   // timestamp in seconds
  @Input() currentTime: number; // timestamp in seconds
  @Output() timeUp = new EventEmitter<void>();
  timeLeft: number;
  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.calculateTimeLeft();
    this.startTimer();
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['startTime'] && !changes['startTime'].isFirstChange()) {
  //     // Stop the old timer
  //     this.destroy$.next();

  //     // Recalculate time left and restart the timer
  //     this.calculateTimeLeft();
  //     this.startTimer();
  //   }
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculateTimeLeft(): void {
    const endTime = this.startTime + 3;
    this.timeLeft = endTime - this.currentTime;
    // console.log(this.startTime);
    // console.log(this.currentTime);
    
    if (this.timeLeft <= 0) {
      // console.log("Timer finished!");
      this.timeUp.emit();
      this.destroy$.next(); // Stop the timer when it reaches 0
    }
  }

  startTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.currentTime++; // assuming you want to increase currentTime
          this.calculateTimeLeft();
        },
        error: error => console.error(error)
      });
  }

}

