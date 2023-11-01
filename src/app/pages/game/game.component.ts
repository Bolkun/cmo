import { Component, OnInit, ElementRef, AfterViewChecked, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { first, from, switchMap, take, tap } from 'rxjs';
// services
import { UserService } from 'src/app/services/user.service';
import { PresenceService } from 'src/app/services/presence.service';
import { FlashMessageService } from 'src/app/services/flash-message.service';
import { ServerService } from 'src/app/services/server.service';
import { RequestService } from 'src/app/services/request.service';
import { GameService } from 'src/app/services/game.service';
// interfaces
import { User, Request, Game, Round, Move } from 'src/app/interfaces/app.interfaces';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, AfterViewChecked {
  userID: string;     // current player
  oponentID: string;  // oponent player
  // User
  user: User;
  // Server
  currentServerRequestSeconds: number;
  currentServerGameSeconds: number;
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
  oponentPlayerName: string;
  timeOutOccurred: boolean = false;
  // Round
  rounds: Round[];

  constructor(
    public userService: UserService,
    private presenceService: PresenceService,
    private flashMessageService: FlashMessageService,
    private serverService: ServerService,
    private requestService: RequestService,
    private gameService: GameService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
    }
    this.userID = localStorage.getItem('userID');
    // Get user data
    this.userService.getUserData(this.userID).subscribe((user: User) => {
      if (user) {
        this.user = user;
        this.requestService.getRequests(this.user.id).subscribe((gameRequests: any[]) => {
          if (gameRequests) {
            from(this.serverService.createOrUpdateServer(this.user.id)).pipe(
              switchMap(() => this.serverService.getServerTimestamp(this.user.id))
            ).subscribe((serverTimestamp: any) => {
              if (serverTimestamp) {
                this.currentServerRequestSeconds = serverTimestamp.seconds;
                // Filter requests that are older than 15 seconds from the current server timestamp
                this.requests = gameRequests.filter(request => {
                  const requestSeconds = request.timestamp.seconds;
                  return (requestSeconds + 15) > this.currentServerRequestSeconds;
                });
              }
            });
          }
        });
      }
    });
    // Get all users
    this.userService.getUsers();
    // ToDo - Cloud Functions: delete finished games
    this.deleteFinishedGames();
    // Get game
    this.gameService.getActiveGame(this.userID).subscribe((games: Game[]) => {
      if (games && games.length > 0) {
        // Filter games where currentUser not left the game, by checking if uid set in one of the fields
        const filteredGames = games.filter(game => {
          return (
            game.leftGamePlayer1Uid !== this.userID &&
            game.leftGamePlayer2Uid !== this.userID
          );
        });

        // Check if there are remaining games after filtering
        if (filteredGames.length > 0) {
          this.game = filteredGames[0];

          from(this.serverService.createOrUpdateServer(this.userID)).pipe(
            switchMap(() => this.serverService.getServerTimestamp(this.userID))
          ).subscribe((serverTimestamp: any) => {
            if (serverTimestamp) {
              this.currentServerGameSeconds = serverTimestamp.seconds;
            }

            this.timeOutOccurred = false; // ToDo - Put in TimerGameComponent the logic

            if (this.userID === this.game.player1Uid) {
              this.oponentID = this.game.player2Uid;
            } else {
              this.oponentID = this.game.player1Uid;
            }

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
              this.oponentPlayerName = this.game.player2Name;
            } else {
              this.nextTurnUid = this.game.player1Uid
              this.currentPlayerName = this.game.player2Name;
              this.oponentPlayerName = this.game.player1Name;
            }

            if (this.game.rounds) {
              this.rounds = this.game.rounds;
            }

            // Check if one of the players pressed 'Leave' button and close game after 15 seconds
            if (this.game.leftGamePlayer1Uid === this.oponentID || this.game.leftGamePlayer2Uid === this.oponentID) {
              if (this.game.status === 'ongoing') {
                this.addMove({ message: `Player ${this.currentPlayerName} wins as ${this.oponentPlayerName} left the game!`, type: 'win' });
                this.game.status = 'left';
                // DB: save
                this.gameService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, this.game.status);
              }
            }
          });
        }
      }
    }), (error) => {
      console.error("Error fetching games:", error);
    };
  }

  // Game
  makeMove(row: number, col: number): void {
    // Checks if game not finished & if there's already a value in the specified cell of the game board
    if (this.game.status !== 'ongoing' || this.board[row][col]) return;
    // Check if it's current player's turn
    if (this.userID !== this.game.currentTurnUid) return;

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
    this.gameService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, state);
  }

  leaveGame() {
    if (this.game.player1Uid === this.userID) {
      this.gameService.leaveGame(this.game.id, 'leftGamePlayer1Uid', this.game.player1Uid);
    } else {
      this.gameService.leaveGame(this.game.id, 'leftGamePlayer2Uid', this.game.player2Uid);
    }
    // clear vars
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
    this.gameService.saveMove(this.game.id, this.board, this.nextTurnUid, this.rounds, 'kicked');
  }

  // Requests
  sendRequest(toUid: string, toDisplayName: string): void {
    // User did not left last game
    if (this.game) {
      this.flashMessageService.showMessage(`You are currently in a game. Leave the game to send requests.`, 'warning');
    } else {
      this.gameService.isUserInGame(toUid).pipe(first(), tap(isInGame => {
        if (!isInGame) {
          this.requestService.sendRequest(this.user.id, this.user.displayName, toUid, toDisplayName);
        } else {
          this.flashMessageService.showMessage(`${toDisplayName} is currently in a game. Please try later.`, 'warning');
        }
        // Hide Menu
        Object.keys(this.showDropdown).forEach(key => {
          this.showDropdown[key] = false;
        });
      })).subscribe();
    }
  }

  acceptRequest(request: Request): void {
    // User did not left last game
    if (this.game) {
      this.leaveGame();
    }

    const playerIdStarts = this.whoStartFirst(request.fromUid, request.toUid);
    this.gameService.createGame(request, playerIdStarts);

    // Delete all game requests involving the opponent
    this.requestService.getRequestsInvolvingOponent(request.fromUid).pipe(take(1)).subscribe((requests: Request[]) => {
      requests.forEach(req => {
        this.requestService.deleteRequest(req.id).then(() => {
          // console.log(`Request ${req.id} deleted successfully`);
        }).catch((error) => {
          console.error(`Error deleting the request ${req.id}:`, error);
        });
      });
    });

    // Delete all game requests involving current user
    this.requestService.getRequestsInvolvingUser(request.toUid).pipe(take(1)).subscribe((requests: Request[]) => {
      requests.forEach(req => {
        this.requestService.deleteRequest(req.id).then(() => {
          // console.log(`Request ${req.id} deleted successfully`);
        }).catch((error) => {
          console.error(`Error deleting the request ${req.id}:`, error);
        });
      });
    });

    // clear vars
    this.game = undefined;
    this.nextTurnUid = undefined;
    this.rounds = undefined;
    this.requests = undefined;
  }

  declineRequest(docId: string): void {
    this.requestService.deleteRequest(docId).then(() => {
      // console.log('Request declined and deleted.');
    }).catch(error => {
      console.error('Error deleting request:', error);
    });
  }

  // Logic
  whoStartFirst(player1Uid: string, player2Uid: string): string {
    return Math.random() < 0.5 ? player1Uid : player2Uid;
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

  // Style
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

  // Logout
  signOut() {
    this.presenceService.signOut();
    this.userService.signOut();
  }

  // ToDo - Cloud Functions: delete finished games, when player1LeftGames and player2LeftGames
  deleteFinishedGames() {
    let player1LeftGames: any[] = [];
    let player2LeftGames: any[] = [];

    this.gameService.getGamesPlayer1Left().subscribe(games1 => {
      player1LeftGames = games1;

      this.gameService.getGamesPlayer2Left().subscribe(games2 => {
        player2LeftGames = games2;

        const gamesBothPlayersLeft = player1LeftGames.filter(game1 =>
          player2LeftGames.some(game2 => game2.id === game1.id)
        );

        gamesBothPlayersLeft.forEach(game => {
          this.gameService.deleteGame(game.id);
        });
      });
    });
  }

}
