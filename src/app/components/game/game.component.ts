import { Component, OnInit, ElementRef, AfterViewChecked, ViewChild, HostListener } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { PresenceService } from 'src/app/services/presence.service';
import { FlashMessageService } from 'src/app/services/flash-message.service';
// interfaces
import { User, Request, Game, Round, Move } from 'src/app/interfaces/app.interfaces';
// libraries
import { Router } from '@angular/router';
import { first, take, tap } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewChecked {
  userID: string;
  // User
  user: User;
  // Request
  requests: Request[] | undefined;
  // Game
  playerSymbol: string;
  board: string[][] = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];
  @ViewChild('scrollMe', { static: false }) private myScrollContainer!: ElementRef;
  showDropdown: { [key: string]: boolean } = {};

  game: Game | undefined;
  nextTurnUid: string | undefined;
  currentPlayerName: string;
  timeOutOccurred: boolean = false;
  // Round
  rounds: Round[];

  constructor(
    public userService: UserService,
    private presenceService: PresenceService,
    private flashMessageService: FlashMessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
    }
    this.userID = localStorage.getItem('userID');
    // Get user data
    this.userService.getUserData(this.userID).subscribe((user: User) => {
      // Get requests
      if (user) {
        this.user = user;
        this.userService.getGameRequests(this.user.id).subscribe((gameRequests: Request[]) => {
          this.requests = gameRequests;
        });
      }
    });

    // Get all users
    this.userService.getUsers();

    // ToDo - Cloud Functions: delete finished games
    this.cleanupGames();

    // Get game 
    this.userService.getGame(this.userID).subscribe((games: Game[]) => {
      if (games && games.length > 0) {
        this.timeOutOccurred = false; // ToDo - Put in TimerGameComponent the logic
        this.game = games[0];

        if (this.userID === this.game.startedUid) {
          this.playerSymbol = 'X';
        } else {
          this.playerSymbol = 'O';
        }

        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            this.board[i][j] = this.game.board[i * 3 + j];
          }
        }

        if (this.game.currentTurnUid === this.game.player1Uid) {
          this.nextTurnUid = this.game.player2Uid
          this.currentPlayerName = this.game.player1Name;
        } else {
          this.nextTurnUid = this.game.player1Uid
          this.currentPlayerName = this.game.player2Name;
        }

        if (this.game.rounds) {
          this.rounds = this.game.rounds;
        }

        // Check if one of the players left the game and declare a winner
        if (this.game.status === 'ongoing') {
          if (this.game.leftGamePlayer1Uid != null || this.game.leftGamePlayer2Uid != null) {
            const leaver = this.game.leftGamePlayer1Uid || this.game.leftGamePlayer2Uid;
            if (leaver === this.game.player1Uid) {
              this.addMove({ message: `Player ${this.game.player2Name} wins as opponent left the game!`, type: 'win' });
            } else {
              this.addMove({ message: `Player ${this.game.player1Name} wins as opponent left the game!`, type: 'win' });
            }
            this.game.status = 'won';
            // DB: save
            this.userService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, this.game.status);
          }
        }
      }
    }), (error) => {
      console.error("Error fetching games:", error);
    };
  }

  // ToDo - Cloud Functions: delete finished games
  cleanupGames() {
    let player1LeftGames: any[] = [];
    let player2LeftGames: any[] = [];

    this.userService.getGamesPlayer1Left().subscribe(games1 => {
      player1LeftGames = games1;

      this.userService.getGamesPlayer2Left().subscribe(games2 => {
        player2LeftGames = games2;

        const gamesBothPlayersLeft = player1LeftGames.filter(game1 =>
          player2LeftGames.some(game2 => game2.id === game1.id)
        );

        gamesBothPlayersLeft.forEach(game => {
          this.userService.deleteGame(game.id);
        });
      });
    });
  }

  ngAfterViewChecked(): void {
    this.scrollHistoryToBottom();
  }

  scrollHistoryToBottom(): void {
    if (this.myScrollContainer && this.myScrollContainer.nativeElement) {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error(err);
      }
    }
  }

  leaveGame() {
    if (this.game.player1Uid === this.userID) {
      this.userService.leaveGame(this.game.id, 'leftGamePlayer1Uid', this.game.player1Uid);
    } else {
      this.userService.leaveGame(this.game.id, 'leftGamePlayer2Uid', this.game.player2Uid);
    }
    this.game = undefined;
    this.nextTurnUid = undefined;
    this.rounds = undefined;
  }

  kickPlayer() {
    if (this.game.currentTurnUid === this.game.player1Uid) {
      this.addMove({ message: `Player ${this.game.player1Name} was kicked out of the game due to timeout reason! Player ${this.game.player1Name} wins!`, type: 'win' });
    } else {
      this.addMove({ message: `Player ${this.game.player2Name} was kicked out of the game due to timeout reason! Player ${this.game.player1Name} wins!`, type: 'win' });
    }
    this.userService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, 'won');
  }

  signOut() {
    this.presenceService.signOut();
    this.userService.signOut();
  }

  makeMove(row: number, col: number): void {
    // Checks if game not finished & if there's already a value in the specified cell of the game board
    if (this.game.status !== 'ongoing' || this.board[row][col]) return;
    // Check if it's current player's turn
    if (this.userID !== this.game.currentTurnUid) return;
    // Check if another player left game
    if ((this.game.leftGamePlayer1Uid != null || this.game.leftGamePlayer2Uid != null)) {
      const leaver = this.game.leftGamePlayer1Uid || this.game.leftGamePlayer2Uid;
      if (leaver === this.game.player1Uid) {
        this.addMove({ message: `Player ${this.game.player2Name} wins as opponent left the game!`, type: 'win' });
      } else {
        this.addMove({ message: `Player ${this.game.player1Name} wins as opponent left the game!`, type: 'win' });
      }
      this.game.status = 'won';
      // DB: save
      this.userService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, this.game.status);
    }

    // Places 'X' or 'O' on specific cell
    this.board[row][col] = this.playerSymbol;

    const state = this.getGameState();

    if (state === 'ongoing') {
      this.addMove({ message: `Player ${this.currentPlayerName} placed ${this.playerSymbol} on board (${row + 1}, ${col + 1})`, type: 'normal' });
    } else if (state === 'won') {
      this.addMove({ message: `Player ${this.currentPlayerName} wins!`, type: 'win' });
    } else {
      this.addMove({ message: `It's a draw!`, type: 'draw' });
    }

    // DB: save
    this.userService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, state);
  }

  addMove(move: Move): void {
    // If there are no rounds or the last round already has 2 moves
    if (this.rounds.length === 0 || this.rounds[this.rounds.length - 1].moves.length >= 2) {
      // Start a new round.
      this.rounds.push({ round: this.rounds.length + 1, moves: [] });
    }
    // Add the move to the latest round.
    this.rounds[this.rounds.length - 1].moves.push(move);
  }

  getGameState(): 'won' | 'draw' | 'ongoing' {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        this.board[i][0] &&
        this.board[i][0] === this.board[i][1] &&
        this.board[i][1] === this.board[i][2]
      ) {
        return 'won';
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (
        this.board[0][i] &&
        this.board[0][i] === this.board[1][i] &&
        this.board[1][i] === this.board[2][i]
      ) {
        return 'won';
      }
    }

    // Check diagonals
    if (
      this.board[0][0] &&
      this.board[0][0] === this.board[1][1] &&
      this.board[1][1] === this.board[2][2]
    ) {
      return 'won';
    }

    if (
      this.board[0][2] &&
      this.board[0][2] === this.board[1][1] &&
      this.board[1][1] === this.board[2][0]
    ) {
      return 'won';
    }

    // Check board for empty cells
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] === "") {
          return 'ongoing';
        }
      }
    }

    return 'draw';
  }

  // Menu
  toggleDropdown(id: string): void {
    // Check if the clicked user is the currently logged-in user
    if (this.userID === id) {
      return; // Return without doing anything if it's the logged-in user
    }
    // Set all dropdowns to hidden
    Object.keys(this.showDropdown).forEach(key => {
      this.showDropdown[key] = false;
    });

    // Toggle the dropdown for the clicked user
    this.showDropdown[id] = true;
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
    this.userService.isUserInGame(toUid).pipe(first(), tap(isInGame => {
      if (!isInGame) {
        this.userService.sendGameRequest(this.user.id, this.user.displayName, toUid, toDisplayName);
      } else {
        this.flashMessageService.showMessage(`You or ${toDisplayName} is currently in a game. Please try later.`, 'warning');
      }
    })).subscribe();
  }

  decideWhoStartFirst(player1Uid: string, player2Uid: string): string {
    return Math.random() < 0.5 ? player1Uid : player2Uid;
  }

  acceptRequest(request: Request): void {
    const playerIdStarts = this.decideWhoStartFirst(request.fromUid, request.toUid);
    this.userService.createGame(request, playerIdStarts);

    // Delete all game requests involving the opponent
    this.userService.getRequestsInvolvingOponent(request.fromUid).pipe(take(1)).subscribe((requests: Request[]) => {
      requests.forEach(req => {
        this.userService.deleteGameRequest(req.id).then(() => {
          // Optionally, you can keep the console.log or remove it if you no longer need it
          //console.log(`Request ${req.id} deleted successfully`);
        }).catch((error) => {
          console.error(`Error deleting the request ${req.id}:`, error);
        });
      });
    });

    // Delete all game requests involving current user
    this.userService.getRequestsInvolvingUser(request.toUid).pipe(take(1)).subscribe((requests: Request[]) => {
      requests.forEach(req => {
        this.userService.deleteGameRequest(req.id).then(() => {
          // Optionally, you can keep the console.log or remove it if you no longer need it
          //console.log(`Request ${req.id} deleted successfully`);
        }).catch((error) => {
          console.error(`Error deleting the request ${req.id}:`, error);
        });
      });
    });

    this.requests = undefined;
  }

  declineRequest(docId: string): void {
    this.userService.deleteGameRequest(docId).then(() => {
      // console.log('Request declined and deleted.');
    }).catch(error => {
      console.error('Error deleting request:', error);
    });
  }

}
