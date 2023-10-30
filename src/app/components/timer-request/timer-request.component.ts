import { Component, Input, OnDestroy, OnInit, Renderer2, ElementRef } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-timer-request',
  templateUrl: './timer-request.component.html',
  styleUrls: ['./timer-request.component.css']
})
export class TimerRequestComponent implements OnInit, OnDestroy {
  @Input() startTime: number;   // timestamp in seconds
  @Input() currentTime: number; // timestamp in seconds
  timeLeft: number;
  private destroy$ = new Subject<void>();

  constructor(private renderer: Renderer2, private el: ElementRef) { }

  ngOnInit(): void {
    this.calculateTimeLeft();

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

  calculateTimeLeft(): void {
    const endTime = this.startTime + 15;
    this.timeLeft = endTime - this.currentTime;

    if (this.timeLeft <= 0) {
      // console.log("Timer finished!");
      this.destroy$.next(); // Stop the timer when it reaches 0.

      // Remove the parent div element
      const parentDiv = this.el.nativeElement.parentElement;
      this.renderer.removeChild(parentDiv.parentNode, parentDiv);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
