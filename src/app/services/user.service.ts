import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, take } from 'rxjs';
import {
  AngularFirestore,
  AngularFirestoreDocument,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import firebase from 'firebase/compat/app'; // firebase.auth

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userData: any; // Save logged in user data
  public regIn = false;
  // public commentCollection!: AngularFirestoreCollection;
  flashMessageTimeout: number = 5000;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public auth: AngularFireAuth, // Inject Firebase auth service
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    public router: Router // public flashMessage: FlashMessagesService
  ) {}

  SignUp(nickname: string, email: string, password: string) {
    if (nickname == '' || nickname == undefined) {
      // this.flashMessage.show('Please write your name!', {
      //   cssClass: 'alert-danger',
      //   timeout: this.flashMessageTimeout,
      // });
      alert('Please write your name!');
      return false;
    }
    return this.auth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign up and returns promise */
        //this.SendVerificationMail();
        this.SetUserData(result.user!, nickname);
        this.regIn = true;
      })
      .catch((error) => {
        // this.flashMessage.show(error.message, {
        //   cssClass: 'alert-danger',
        //   timeout: this.flashMessageTimeout,
        // });
        alert(error.message);
      });
  }

  SignIn(email: string, password: string): Promise<boolean | void> {
    return this.auth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        /* Login if user email verified */
        // if (!result.user?.emailVerified) {
        //   // this.flashMessage.show('Please verify Email Address!', {
        //   //   cssClass: 'alert-danger',
        //   //   timeout: this.flashMessageTimeout,
        //   // });
        //   alert('Please verify Email Address!')
        //   return false;
        // }
        this.GetUserData(result.user!.uid)
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
        alert(error.message);
        return false;
      });
  }

  SendVerificationMail(): Promise<void> | void {
    const user = firebase.auth().currentUser;
    if (user !== null) {
      if (user.emailVerified) {
        // this.flashMessage.show('Email already verified!', {
        //   cssClass: 'alert-danger',
        //   timeout: this.flashMessageTimeout,
        // });
        alert('Email already verified!');
        return Promise.resolve(); // Resolve the promise immediately
      } else {
        return user.sendEmailVerification().then(() => {
          // Function createUserWithEmailAndPassword() in SignIn method promise that emailVarified will be true
          // this.router.navigate(['verify-email']);
        });
      }
    } else {
      // this.flashMessage.show('Cannot send email to unknown user!', {
      //   cssClass: 'alert-danger',
      //   timeout: this.flashMessageTimeout,
      // });
      alert('Cannot send email to unknown user!');
      return Promise.reject('Unknown user'); // Reject the promise
    }
  }

  ResetPassword(passwordResetEmail: string) {
    return this.auth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        // this.flashMessage.show('Password reset email sent, check your inbox!', {
        //   cssClass: 'alert-success',
        //   timeout: this.flashMessageTimeout,
        // });
        alert('Password reset email sent, check your inbox!');
      })
      .catch((error) => {
        // this.flashMessage.show(error.message, {
        //   cssClass: 'alert-danger',
        //   timeout: this.flashMessageTimeout,
        // });
        alert(error.message);
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

  // Sign up with Google
  GoogleReg() {
    this.regIn = true;
    return this.RegLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Sign in with Google
  GoogleLogin() {
    return this.RegLogin(new firebase.auth.GoogleAuthProvider());
  }

  // Reg logic to run auth providers
  RegLogin(provider: firebase.auth.AuthProvider) {
    return this.auth
      .signInWithPopup(provider)
      .then((result: any) => {
        this.GetUserDataOnEmail(JSON.stringify(result.user?.email));
        if (!this.userData) {
          this.SetUserData(result.user!);
        }
        this.ngZone.run(() => {
          // Go to dashboard
          document.getElementById('closeLogin')!.click();
          document.getElementById('closeLogin')!.style.display = 'none';
          // document.getElementById('name')!.innerHTML = this.userData.displayName;
        });
        localStorage.setItem('userID', result.user?.uid);
        setTimeout(() => {
          localStorage.setItem('userID', result.user?.uid);
        }, 100);
        localStorage.setItem('userEmail', JSON.stringify(result.user?.email));
      })
      .catch((error) => {
        // this.flashMessage.show(error.message, {
        //   cssClass: 'alert-danger',
        //   timeout: this.flashMessageTimeout,
        // });
        alert(error.message);
      });
  }

  GetUserData(uid: string) {
    return this.afs.collection('users').doc(uid).valueChanges();
  }

  GetUserDataOnEmail(email: string) {
    return this.afs
      .collection('users', (ref) => ref.where('email', '==', email))
      .valueChanges();
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
}
