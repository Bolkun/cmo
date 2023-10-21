import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  constructor(public userService: UserService, public router: Router) {}

  ngOnInit(): void {
    if (this.userService.isLoggedIn()) {
      this.router.navigate(['game']);
    }
  }
}
