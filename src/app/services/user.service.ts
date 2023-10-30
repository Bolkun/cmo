import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, combineLatest, first, take, tap } from 'rxjs';
import { FlashMessageService } from './flash-message.service';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app'; // firebase.auth
// interfaces
import { User, Server, Game, Round } from 'src/app/interfaces/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userData: User;
  public regIn = false;
  users$: Observable<User[]>;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public auth: AngularFireAuth, // Inject Firebase auth service
    public ngZone: NgZone,        // NgZone service to remove outside scope warning
    public router: Router,
    private flashMessageService: FlashMessageService
  ) { }

  signUp(nickname: string, email: string, password: string) {
    if (nickname == '' || nickname == undefined) {
      this.flashMessageService.showMessage('Please write your name!', 'error');
      return false;
    }
    return this.auth.createUserWithEmailAndPassword(email, password).then((result) => {
      this.sendVerificationMail();
      this.setUserData(result.user!, nickname);
      this.regIn = true;
    }).catch((error) => {
      this.flashMessageService.showMessage(error.message, 'error');
    });
  }

  signIn(email: string, password: string): Promise<boolean> {
    return this.auth.signInWithEmailAndPassword(email, password).then(result => {
      if (!result.user?.emailVerified) {
        this.flashMessageService.showMessage('Please verify Email Address!', 'error');
        throw new Error('Email not verified');
      }
      return result.user!.uid;
    }).then(uid => this.getUserData(uid).pipe(first()).toPromise()).then(data => {
      localStorage.setItem('userID', data.id);
      this.ngZone.run(() => {
        this.router.navigate(['game']);
      });
      return true;
    }).catch(error => {
      this.flashMessageService.showMessage(error.message, 'error');
      return false;
    });
  }

  // Sign up or Sign In with Google
  googleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.auth.signInWithPopup(provider).then((result: any) => {
      if (result && result.user) {
        if (result.additionalUserInfo.isNewUser) {
          this.setUserData(result.user);
        } else {
          this.getUserData(result.user.uid);
        }
        localStorage.setItem('userID', result.user.uid);
        // Navigate to game
        this.router.navigate(['/game']);
      } else {
        // Handle scenario where result or result.user is undefined
        this.flashMessageService.showMessage('Google Authentication failed!', 'error');
      }
    }).catch((error) => {
      this.flashMessageService.showMessage(error.message, 'error');
    });
  }

  // Save data after sign up to firestore
  setUserData(user: firebase.User, nickname?: string) {
    // Get a reference to the Firestore document based on the provided docId
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    // Construct the data that you want to save
    this.userData = {
      role: 'registeredUsers',
      email: user.email,
      displayName: nickname ? nickname : user.displayName,
      photoURL: user.photoURL!,
    };
    // Save the data to Firestore, merging with any existing data
    return userRef.set(this.userData, {
      merge: true,
    });
  }

  sendVerificationMail(): Promise<void> | void {
    const user = firebase.auth().currentUser;
    if (user !== null) {
      if (user.emailVerified) {
        this.flashMessageService.showMessage('Email already verified!', 'error');
        return Promise.resolve();
      } else {
        return user.sendEmailVerification().then(() => {
          this.router.navigate(['verify-email']);
        });
      }
    } else {
      this.flashMessageService.showMessage('Cannot send email to unknown user!', 'error');
      return Promise.reject('Unknown user');
    }
  }

  resetPassword(email: string) {
    return this.auth.sendPasswordResetEmail(email).then(() => {
      this.flashMessageService.showMessage('Password reset email sent, check your inbox!', 'info');
    }).catch((error) => {
      this.flashMessageService.showMessage(error.message, 'error');
    });
  }

  isLoggedIn(): boolean {
    try {
      const userId = localStorage.getItem('userID');
      return userId !== null && userId !== undefined && userId !== '';
    } catch (e) {
      console.error('Error checking user login status:', e);
      return false;
    }
  }

  getUserData(docId: string) {
    return this.afs.doc(`users/${docId}`).snapshotChanges().pipe(
      map(action => {
        const data = action.payload.data() as User;
        const id = action.payload.id;
        return { id, ...data };
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.users$ = this.afs.collection('users').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data() as User; // Assuming you have a type named User for the user data
          const id = a.payload.doc.id;
          return { id, ...data };
        });
      })
    );
  }

  signOut() {
    return this.auth.signOut().then(() => {
      localStorage.clear();
      this.router.navigate(['login']);
    });
  }

  // Server
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

  // Requests
  sendGameRequest(fromUid: string, fromDisplayName: string, toUid: string, toDisplayName: string): Promise<void> {
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

  getGameRequests(currentUserId: string): Observable<Request[]> { // ToDo - Cloud Functions: delete game requests older than 15 seconds
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

  deleteGameRequest(docId: string): Promise<void> {
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

  // Games
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

  getGame(uid: string): Observable<Game[]> {
    // Check if uid is player1 or player2 and also if he left a game
    const player1Games$ = this.afs.collection('games', ref => ref
      .where('player1Uid', '==', uid)
      .where('status', '==', 'ongoing')
      .where('leftGamePlayer1Uid', '==', null)
    ).snapshotChanges();

    const player2Games$ = this.afs.collection('games', ref => ref
      .where('player2Uid', '==', uid)
      .where('status', '==', 'ongoing')
      .where('leftGamePlayer2Uid', '==', null)
    ).snapshotChanges();

    return combineLatest([player1Games$, player2Games$]).pipe(
      map(([player1Snapshots, player2Snapshots]) => {
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

  saveMove(gameId: string, newBoardState: string[][], nextTurnUid: string, rounds: Round[], status: 'ongoing' | 'won' | 'draw'): Promise<void> {
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
