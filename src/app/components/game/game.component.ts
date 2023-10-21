import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimerService } from 'src/app/services/timer.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  // Game
  board: string[][] = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ];
  currentPlayer: string = 'X';
  userID: string | null = null;
  userEmail: string | null = null;

  constructor(
    //public timerService: TimerService,
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userID = localStorage.getItem('userID');
    this.userEmail = localStorage.getItem('userEmail');
  }

  signOut() {
    const confirmation = confirm('Do you want to logout?')
    if(confirmation) {
      this.userService.SignOut();
    }
  }

  makeMove(row: number, col: number): void {
    if (!this.board[row][col]) {
      this.board[row][col] = this.currentPlayer;
      
      if (this.checkVictory()) {
        alert(`${this.currentPlayer} wins!`);
      } else {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      }
    }
  }

  checkVictory(): boolean {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (this.board[i][0] && this.board[i][0] === this.board[i][1] && this.board[i][1] === this.board[i][2]) {
        return true;
      }
    }
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (this.board[0][i] && this.board[0][i] === this.board[1][i] && this.board[1][i] === this.board[2][i]) {
        return true;
      }
    }
    // Check diagonals
    if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
      return true;
    }
    if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
      return true;
    }
    return false;
  }  
}
