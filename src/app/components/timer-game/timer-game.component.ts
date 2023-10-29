import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-timer-game',
  templateUrl: './timer-game.component.html',
  styleUrls: ['./timer-game.component.css']
})
export class TimerGameComponent implements OnInit, OnDestroy, OnChanges {
  @Input() startTime: number;
  @Output() timeUp = new EventEmitter<void>();
  timeLeft: number;
  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    this.calculateTimeLeft();
    this.startTimer();
  }

  startTimer(): void {
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => this.calculateTimeLeft(),
      error => console.error(error)
    );
  }

  calculateTimeLeft(): void {
    const elapsedTime = Date.now() - this.startTime;
    const secondsElapsed = Math.floor(elapsedTime / 1000);
    this.timeLeft = 14 - secondsElapsed;

    if (this.timeLeft <= 0) {
      this.timeUp.emit();
      this.destroy$.next(); // Stop the timer when it reaches 0
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startTime'] && !changes['startTime'].isFirstChange()) {
      // Stop the old timer
      this.destroy$.next();

      // Recalculate time left and restart the timer
      this.calculateTimeLeft();
      this.startTimer();
    }
  }

}

