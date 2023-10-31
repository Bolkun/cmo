import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
// firebase
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
// interfaces
import { Request } from 'src/app/interfaces/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class RequestService {

  constructor(
    private afs: AngularFirestore
  ) { }

  sendRequest(fromUid: string, fromDisplayName: string, toUid: string, toDisplayName: string): Promise<void> {
    const gameRequestsRef = this.afs.collection('gameRequests');
    // Find a game request with matching fromUid and toUid
    return gameRequestsRef.ref.where('fromUid', '==', fromUid)
      .where('toUid', '==', toUid)
      .get()
      .then(snapshot => {
        // If a matching document is found, update the timestamp
        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          return gameRequestsRef.doc(docId).update({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => { });
        } else {
          // If no matching document is found, add a new one
          return gameRequestsRef.add({
            fromUid,
            fromDisplayName,
            toUid,
            toDisplayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          }).then(() => { });
        }
      }).catch((error) => {
        throw error;
      });
  }

  getRequests(currentUserId: string): Observable<Request[]> { // ToDo - Cloud Functions: delete game requests older than 15 seconds
    return this.afs.collection('gameRequests', ref => ref.where('toUid', '==', currentUserId))
      .snapshotChanges()
      .pipe(
        map(requestSnapshots => {
          return requestSnapshots.map(snapshot => {
            const data = snapshot.payload.doc.data() as Request;
            const docId = snapshot.payload.doc.id;
            return { id: docId, ...data };
          });
        })
      );
  }

  deleteRequest(docId: string): Promise<void> {
    return this.afs.doc(`gameRequests/${docId}`).delete();
  }

  getRequestsInvolvingOponent(uid: string): Observable<any[]> {
    return this.afs.collection('gameRequests', ref =>
      ref.where('toUid', '==', uid)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Request;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getRequestsInvolvingUser(uid: string): Observable<any[]> {
    return this.afs.collection('gameRequests', ref =>
      ref.where('fromUid', '==', uid)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Request;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
  
}
