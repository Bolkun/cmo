import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

// firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { GameComponent } from './pages/game/game.component';
import { FlashMessageComponent } from './components/flash-message/flash-message.component';
import { TimerRequestComponent } from './components/timer-request/timer-request.component';
import { TimerGameComponent } from './components/timer-game/timer-game.component';
import { UserPresenceComponent } from './components/user-presence/user-presence.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { CoreComponent } from './pages/core/core.component';
import { WorldComponent } from './pages/world/world.component';
import { LogoutComponent } from './components/menu/logout/logout.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    ResetPasswordComponent,
    VerifyEmailComponent,
    GameComponent,
    FlashMessageComponent,
    TimerRequestComponent,
    TimerGameComponent,
    UserPresenceComponent,
    NotFoundComponent,
    CoreComponent,
    WorldComponent,
    LogoutComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

    // firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
