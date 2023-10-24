import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import { tap, map, switchMap, first, connect } from 'rxjs/operators';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { timer, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  constructor(public auth: AngularFireAuth, public db: AngularFireDatabase) {
  }

  get timestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  sendGameRequest(fromUid: string, fromDisplayName: string, toUid: string, toDisplayName: string): Promise<void> {
    const gameRequestsRef = this.db.list('gameRequests');
    const newRequest = {
      fromUid,
      fromDisplayName,
      toUid,
      toDisplayName,
      timestamp: this.timestamp,
      status: 'pending'
    };

    return gameRequestsRef.push(newRequest)
      .then(() => { })
      .catch((error) => {
        throw error;
      });
  }

  // sendGameRequest(fromUid: string, fromDisplayName: string, toUid: string, toDisplayName: string): Promise<void> {
  //   return this.afs.collection('gameRequests').add({
  //     fromUid,
  //     fromDisplayName,
  //     toUid,
  //     toDisplayName,
  //     timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  //     status: 'pending'
  //   }).then(() => { }).catch((error) => {
  //     throw error;
  //   });
  // }

  getGameRequests(currentUserId: string): Observable<any[]> {
    return this.db.list('gameRequests', ref => ref.orderByChild('toUid').equalTo(currentUserId))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.val() as any;
          const id = a.payload.key;
          const currentTime = this.timestamp;
          // const differenceInSeconds = (currentTime - data.timestamp) / 1000;
          // if (differenceInSeconds > 15) {
          //   this.deleteGameRequest(id);
          // }

          return { id, ...data };
        }))
      );
  }

  

  // getGameRequests(currentUserId: string): Observable < any[] > {
  //   return this.afs.collection('gameRequests', ref =>
  //     ref.where('toUid', '==', currentUserId)
  //       .where('status', '==', 'pending')
  //   ).snapshotChanges().pipe(
  //     map(actions => actions.map(a => {
  //       const data = a.payload.doc.data() as any;
  //       const id = a.payload.doc.id;
  //       const currentTime = Timestamp.now();
  //       const differenceInSeconds = (currentTime.seconds - data.timestamp.seconds);
  //       if (differenceInSeconds > 15) {
  //         this.deleteGameRequest(id);
  //       }
  //       return { id, ...data };
  //     }))
  //   );
  // }

  // deleteGameRequest(docId: string): Promise<void> {
  //   // return this.afs.doc(`gameRequests/${docId}`).delete();
  // }
}
