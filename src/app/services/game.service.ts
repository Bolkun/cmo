import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
// firebase
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
// interfaces
import { Game, Round } from 'src/app/interfaces/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(
    private afs: AngularFirestore
  ) { }

  createGame(request: any, playerIdStarts: string) {
    this.afs.collection('games').add({
      board: ['', '', '', '', '', '', '', '', ''],
      player1Uid: request.fromUid,
      player2Uid: request.toUid,
      player1Name: request.fromDisplayName,
      player2Name: request.toDisplayName,
      startedUid: playerIdStarts,
      currentTurnUid: playerIdStarts,
      status: 'ongoing',
      rounds: [{ round: 1, moves: [] }],
      leftGamePlayer1Uid: null,
      leftGamePlayer2Uid: null,
      timestampForMoves: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      // Navigate to the game screen or update the UI to show the game board
    }).catch(error => {
      console.error("Error starting the game:", error);
    });
  }

  getGames(uid: string): Observable<Game[]> {
    // Query for ongoing games where the provided 'uid' matches either 'player1Uid' or 'player2Uid'
    const player1Games$ = this.afs.collection('games', ref => ref
      .where('player1Uid', '==', uid)
    ).snapshotChanges();
  
    const player2Games$ = this.afs.collection('games', ref => ref
      .where('player2Uid', '==', uid)
    ).snapshotChanges();
  
    // Combine the two Observables to wait for both to complete
    return combineLatest([player1Games$, player2Games$]).pipe(
      map(([player1Snapshots, player2Snapshots]) => {
        // Map the snapshot data to Game objects and merge them into a single array
        const player1Games = player1Snapshots.map(snapshot => {
          const data = snapshot.payload.doc.data() as Game;
          const docId = snapshot.payload.doc.id;
          return { id: docId, ...data };
        });
  
        const player2Games = player2Snapshots.map(snapshot => {
          const data = snapshot.payload.doc.data() as Game;
          const docId = snapshot.payload.doc.id;
          return { id: docId, ...data };
        });
  
        return [...player1Games, ...player2Games];
      })
    );
  }  

  getGamesPlayer1Left(): Observable<any[]> { // ToDo - Cloud Functions: delete finished games
    return this.afs.collection('games', ref => ref
      .where('leftGamePlayer1Uid', '!=', null)
    ).snapshotChanges().pipe(
      map(gameSnapshots => {
        return gameSnapshots.map(snapshot => {
          const data = snapshot.payload.doc.data() as Game;
          const docId = snapshot.payload.doc.id;
          return { id: docId, ...data };
        });
      })
    );
  }

  getGamesPlayer2Left(): Observable<any[]> { // ToDo - Cloud Functions: delete finished games
    return this.afs.collection('games', ref => ref
      .where('leftGamePlayer2Uid', '!=', null)
    ).snapshotChanges().pipe(
      map(gameSnapshots => {
        return gameSnapshots.map(snapshot => {
          const data = snapshot.payload.doc.data() as Game;
          const docId = snapshot.payload.doc.id;
          return { id: docId, ...data };
        });
      })
    );
  }

  deleteGame(docId: string): Promise<void> {
    return this.afs.doc(`games/${docId}`).delete();
  }

  saveMove(gameId: string, newBoardState: string[][], nextTurnUid: string, rounds: Round[], status: string): Promise<void> {
    return this.afs.doc(`games/${gameId}`).update({
      board: [].concat(...newBoardState),
      currentTurnUid: nextTurnUid,
      status: status,
      rounds: rounds,
      timestampForMoves: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  leaveGame(gameId: string, leftGameColumn: string, uid: string): Promise<void> {
    return this.afs.doc(`games/${gameId}`).update({
      [leftGameColumn]: uid
    });
  }

  isUserInGame(uid: string): Observable<boolean> {
    // Query for player1Uid
    const player1Games$ = this.afs.collection('games', ref => ref
      .where('status', '==', 'ongoing')
      .where('player1Uid', '==', uid)
    ).snapshotChanges();

    // Query for player2Uid
    const player2Games$ = this.afs.collection('games', ref => ref
      .where('status', '==', 'ongoing')
      .where('player2Uid', '==', uid)
    ).snapshotChanges();

    // Combine both queries and check if either returns a game
    return combineLatest([player1Games$, player2Games$]).pipe(
      map(([player1Games, player2Games]) => {
        return player1Games.length > 0 || player2Games.length > 0;
      })
    );
  }
  
}
