import firebase from 'firebase/compat/app';

export interface User {
  id?: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: string;
}

export interface Server {
  uid: string;
  currentTimestamp: firebase.firestore.Timestamp;
}

export interface Request {
  id?: string;
  fromDisplayName: string;
  fromUid: string;
  toDisplayName: string;
  toUid: string;
  timestamp: firebase.firestore.Timestamp;  // started
}

export interface Game {
  id?: string
  board: string[];
  player1Uid: string;
  player2Uid: string;
  player1Name: string;
  player2Name: string;
  startedUid: string;
  currentTurnUid: string;
  status: 'ongoing' | 'won' | 'draw' | 'kicked' | 'left';
  rounds: Round[] | null;
  leftGamePlayer1Uid: string | null;
  leftGamePlayer2Uid: string | null;
  timestampForMoves: firebase.firestore.Timestamp;
}

export interface Round {
  round: number;
  moves: Move[];
}

export interface Move {
  message: string;
  type: 'normal' | 'win' | 'draw';
}
