import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TimerService {

  constructor() { }

  getTimerObservable(duration: number): Observable<number> {
    return timer(0, 1000).pipe(
      take(duration + 1),
      map(tick => duration - tick)
    );
  }
}
