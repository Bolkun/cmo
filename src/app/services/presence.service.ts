import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import { tap, map, switchMap, first, connect } from 'rxjs/operators';
import { of } from 'rxjs';

/*
1. Signed-in and using app (online)
2. Signed-in but app is closed (offline)
3. Signed-in but on a different browser tab (away) -> user navigates to a new tab
4. Signed-out but app is still opened (offline)
5. Signed-out and app closed (offline)
*/

@Injectable({
  providedIn: 'root',
})
export class PresenceService {

  constructor(public auth: AngularFireAuth, public db: AngularFireDatabase) {
    console.log('presence');
    this.updateOnUser().subscribe();
    this.updateOnDisconnect().subscribe();
    this.updateOnAway();
  }

  getPresence(uid: string) {
    return this.db.object(`status/${uid}`).valueChanges();
  }

  getUser() {
    return this.auth.authState.pipe(first()).toPromise();
  }

  async setPresence(status: string) {
    const user = await this.getUser();
    if (user) {
      return this.db
        .object(`status/${user.uid}`)
        .update({ status, timestamp: this.timestamp });
    }
  }

  get timestamp() {
    // return firebase.database.ServerValue.TIMESTAMP;
    return firebase.database?.ServerValue?.TIMESTAMP;
  }

  updateOnUser() {
    const connection = this.db
      .object('.info/connected')
      .valueChanges()
      .pipe(map((connected) => (connected ? 'online' : 'offline')));

    return this.auth.authState.pipe(
      switchMap((user) => (user ? connection : of('offline'))),
      tap((status) => this.setPresence(status))
    );
  }

  updateOnAway() {
    document.onvisibilitychange = (e) => {
      if (document.visibilityState === 'hidden') {
        this.setPresence('away');
      } else {
        this.setPresence('online');
      }
    };
  }

  async signOut() {
    await this.setPresence('offline');
    await this.auth.signOut();
  }

  // User closes the app, case 2 and 5
  updateOnDisconnect() {
    return this.auth.authState.pipe(
      tap((user) => {
        if (user) {
          this.db.object(`status/${user.uid}`).query.ref.onDisconnect().update({
            status: 'offline',
            timestamp: this.timestamp,
          });
        }
      })
    );
  }
}
