import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {

  constructor(public userService: UserService, public router: Router) {}

  ngOnInit(): void {}

  async signUp(userNickname: string, userEmail: string, userPwd: string) {
    await this.userService.SignUp(userNickname, userEmail, userPwd);
  }

  async googleReg() {
    await this.userService.GoogleAuth();
  }
}
