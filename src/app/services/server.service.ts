import { Injectable } from '@angular/core';
import { Observable, map, take } from 'rxjs';
// firebase
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
// interfaces
import { Server } from 'src/app/interfaces/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  createOrUpdateServer(uid: string): Promise<void> {
    const serverRef = this.afs.collection('server').doc(uid);
    return serverRef.set({
      uid,
      currentTimestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  getServerTimestamp(uid: string): Observable<any> {
    return this.afs.collection<Server>('server', ref => ref.where('uid', '==', uid)).valueChanges().pipe(
      map(docs => (docs.length ? docs[0].currentTimestamp : undefined)),
      take(1)
    );
  }
  
}
