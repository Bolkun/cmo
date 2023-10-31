import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, combineLatest, first, take, tap } from 'rxjs';
import { FlashMessageService } from './flash-message.service';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
// interfaces
import { User } from 'src/app/interfaces/app.interfaces';

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

}
