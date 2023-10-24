import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, take } from 'rxjs';
import { Observable } from 'rxjs';
import { FlashMessageService } from './flash-message.service';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import firebase from 'firebase/compat/app'; // firebase.auth
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userData: any;
  public regIn = false;
  flashMessageTimeout: number = 5000;
  users$: Observable<any[]>;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public auth: AngularFireAuth, // Inject Firebase auth service
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    public router: Router,
    private flashMessageService: FlashMessageService
  ) { }

  SignUp(nickname: string, email: string, password: string) {
    if (nickname == '' || nickname == undefined) {
      this.flashMessageService.showMessage('Please write your name!', 'error');
      return false;
    }
    return this.auth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.SendVerificationMail();
        this.SetUserData(result.user!, nickname);
        this.regIn = true;
      })
      .catch((error) => {
        this.flashMessageService.showMessage(error.message, 'error');
      });
  }

  SignIn(email: string, password: string): Promise<boolean | void> {
    return this.auth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        // Login if user email verified
        if (!result.user?.emailVerified) {
          this.flashMessageService.showMessage(
            'Please verify Email Address!',
            'error'
          );
          return false;
        }
        this.getUserData(result.user!.uid)
          .pipe(take(1))
          .subscribe((res: any) => {
            localStorage.setItem('userID', res['uid']);
          });
        localStorage.setItem('userEmail', JSON.stringify(result.user?.email));
        this.ngZone.run(() => {
          // Go to game
          this.router.navigate(['game']);
        });
        return true;
      })
      .catch((error) => {
        this.flashMessageService.showMessage(error.message, 'error');
        return false;
      });
  }

  SendVerificationMail(): Promise<void> | void {
    const user = firebase.auth().currentUser;
    if (user !== null) {
      if (user.emailVerified) {
        this.flashMessageService.showMessage(
          'Email already verified!',
          'error'
        );
        return Promise.resolve();
      } else {
        return user.sendEmailVerification().then(() => {
          this.router.navigate(['verify-email']);
        });
      }
    } else {
      this.flashMessageService.showMessage(
        'Cannot send email to unknown user!',
        'error'
      );
      return Promise.reject('Unknown user');
    }
  }

  ResetPassword(passwordResetEmail: string) {
    return this.auth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        this.flashMessageService.showMessage(
          'Password reset email sent, check your inbox!',
          'info'
        );
      })
      .catch((error) => {
        this.flashMessageService.showMessage(error.message, 'error');
      });
  }

  isLoggedIn(): boolean {
    const userEmail = JSON.parse(localStorage.getItem('userEmail')!);
    if (userEmail == null) {
      return false;
    } else {
      return true;
    }
  }

  isAdminLoggedIn() {
    if (this.isLoggedIn()) {
      if (this.userData) {
        return this.userData.role! === 'admin' ? true : false;
      }
    }
    return false;
  }

  // Sign up and Sign In with Google
  GoogleAuth() {
    return this.RegLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Reg logic to run auth providers
  RegLogin(provider: firebase.auth.AuthProvider) {
    return this.auth.signInWithPopup(provider).then((result: any) => {
      if (result && result.user) {
        this.GetUserDataOnEmail(JSON.stringify(result.user.email));

        // Check if userData exists, if not set it
        if (!this.userData) {
          this.SetUserData(result.user);
        }

        localStorage.setItem('userID', result.user.uid);
        localStorage.setItem('userEmail', JSON.stringify(result.user.email));

        // Navigate to the game if authentication is successful
        this.router.navigate(['/game']);
      } else {
        // Handle the scenario where result or result.user is undefined
        this.flashMessageService.showMessage('Authentication failed!', 'error');
      }
    })
      .catch((error) => {
        this.flashMessageService.showMessage(error.message, 'error');
      });
  }

  GetUserDataOnEmail(email: string) {
    return this.afs
      .collection('users', (ref) => ref.where('email', '==', email))
      .valueChanges();
  }

  fetchUsers() {
    this.users$ = this.afs.collection('users').valueChanges();
  }

  getUserData(uid: string) {
    return this.afs.doc(`users/${uid}`).valueChanges();
  }

  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user: firebase.User, nickname?: string) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    this.userData = {
      uid: user.uid,
      role: 'registeredUsers',
      email: user.email,
      displayName: nickname ? nickname : user.displayName,
      photoURL: user.photoURL!,
    };
    return userRef.set(this.userData, {
      merge: true,
    });
  }

  // Logout
  SignOut() {
    return this.auth.signOut().then(() => {
      localStorage.clear();
      this.router.navigate(['login']);
    });
  }

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
          }).then(() => { }); // Ensure we're always returning Promise<void>
        } else {
          // If no matching document is found, add a new one
          return gameRequestsRef.add({
            fromUid,
            fromDisplayName,
            toUid,
            toDisplayName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
          }).then(() => { }); // Ensure we're always returning Promise<void>
        }
      }).catch((error) => {
        throw error;
      });
  }

  getGameRequests(currentUserId: string): Observable<any[]> {
    return this.afs.collection('gameRequests', ref =>
      ref.where('toUid', '==', currentUserId)
        .where('status', '==', 'pending')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        const currentTime = Timestamp.now();
        const differenceInSeconds = (currentTime.seconds - data.timestamp.seconds);
        if (differenceInSeconds > 15) {
          this.deleteGameRequest(id);
        }
        return { id, ...data };
      }))
    );
  }

  deleteGameRequest(docId: string): Promise<void> {
    return this.afs.doc(`gameRequests/${docId}`).delete();
  }

}
