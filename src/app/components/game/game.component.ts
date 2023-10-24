import { Component, OnInit, Renderer2, ElementRef, AfterViewChecked, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { TimerService } from 'src/app/services/timer.service';
import { UserService } from 'src/app/services/user.service';
import { PresenceService } from 'src/app/services/presence.service';
import { RequestService } from 'src/app/services/request.service';
import { FlashMessageService } from 'src/app/services/flash-message.service';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

interface User {
  displayName: string;
  email: string;
  photoURL: string | null;
  role: string;
  uid: string;
}

interface Request {
  id: string;
  fromDisplayName: string;
  fromUid: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: firebase.firestore.Timestamp;
  toDisplayName: string;
  toUid: string;
}

interface Move {
  message: string;
  type: 'normal' | 'win' | 'draw';
}

interface Round {
  round: number;
  moves: Move[];
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewChecked {
  // User
  currentPlayer: string = 'X';
  userID: string | null = null;
  userEmail: string | null = null;
  user: User | undefined;
  // Game
  board: string[][] = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];
  rounds: Round[] = [];
  gameOver: boolean = false;
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  showDropdown: { [key: string]: boolean } = {};
  requests: Request[] = [];

  constructor(
    public userService: UserService,
    private presenceService: PresenceService,
    private requestService: RequestService,
    private flashMessageService: FlashMessageService,
    private router: Router,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.userID = localStorage.getItem('userID');
    this.userEmail = localStorage.getItem('userEmail');

    // Get user data
    this.userService.getUserData(this.userID).subscribe((userData: User) => {
      this.user = userData;
      // Get requests
      if (this.user) {
        this.userService.getGameRequests(this.user.uid).subscribe((gameRequests: Request[]) => {
          this.requests = gameRequests;
        });
      }
    });

    // Get all users
    this.userService.fetchUsers();
  }

  ngAfterViewChecked(): void {
    this.scrollHistoryToBottom();
  }

  scrollHistoryToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  }

  signOut() {
    this.presenceService.signOut();
    this.userService.SignOut();
  }

  makeMove(row: number, col: number): void {
    if (this.gameOver || this.board[row][col]) return;

    this.board[row][col] = this.currentPlayer;

    if (this.currentPlayer === 'X') this.startNewRound();

    this.addMove({ message: `Player ${this.currentPlayer} placed ${this.currentPlayer} on board (${row + 1}, ${col + 1})`, type: 'normal' });

    if (this.checkVictory()) {
      this.endGame({ message: `Player ${this.currentPlayer} wins!`, type: 'win' });
      return;
    }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

    if (this.checkDraw()) {
      this.endGame({ message: `It's a draw!`, type: 'draw' });
    }
  }

  startNewRound(): void {
    this.rounds.push({ round: this.rounds.length + 1, moves: [] });
  }

  addMove(move: Move): void {
    this.rounds[this.rounds.length - 1].moves.push(move);
  }

  endGame(move: Move): void {
    this.gameOver = true;
    this.addMove(move);
  }

  checkVictory(): boolean {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        this.board[i][0] &&
        this.board[i][0] === this.board[i][1] &&
        this.board[i][1] === this.board[i][2]
      ) {
        return true;
      }
    }
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (
        this.board[0][i] &&
        this.board[0][i] === this.board[1][i] &&
        this.board[1][i] === this.board[2][i]
      ) {
        return true;
      }
    }
    // Check diagonals
    if (
      this.board[0][0] &&
      this.board[0][0] === this.board[1][1] &&
      this.board[1][1] === this.board[2][2]
    ) {
      return true;
    }
    if (
      this.board[0][2] &&
      this.board[0][2] === this.board[1][1] &&
      this.board[1][1] === this.board[2][0]
    ) {
      return true;
    }
    return false;
  }

  checkDraw(): boolean {
    // Check if all fields are set
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] === "") {
          return false;
        }
      }
    }
    return true;
  }
  // Menu
  toggleDropdown(uid: string): void {
    // Check if the clicked user is the currently logged-in user
    if (this.userID === uid) {
      return; // Return without doing anything if it's the logged-in user
    }
    // Set all dropdowns to hidden
    Object.keys(this.showDropdown).forEach(key => {
      this.showDropdown[key] = false;
    });

    // Toggle the dropdown for the clicked user
    this.showDropdown[uid] = true;
  }

  @HostListener('document:click', ['$event'])
  globalClick(event: any): void {
    // If the clicked element is not a dropdown menu or a td, hide all dropdowns
    if (!event.target.classList.contains('dropdown-menu') && !event.target.closest('td')) {
      Object.keys(this.showDropdown).forEach(key => {
        this.showDropdown[key] = false;
      });
    }
  }

  sendRequest(toUid: string, toDisplayName: string): void {
    //this.requestService.sendGameRequest(this.user.uid, this.user.displayName, toUid, toDisplayName);
    this.userService.sendGameRequest(this.user.uid, this.user.displayName, toUid, toDisplayName);
  }

  acceptRequest(request: any): void {

  }

  declineRequest(docId: string): void {
    this.userService.deleteGameRequest(docId).then(() => {
      console.log('Request declined and deleted.');
    }).catch(error => {
      console.error('Error deleting request:', error);
    });
  }


}
