import firebase from 'firebase/compat/app';

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: string;
}

export interface Request {
  id: string;
  fromDisplayName: string;
  fromUid: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: firebase.firestore.Timestamp;
  toDisplayName: string;
  toUid: string;
}

export interface Game {
  id: string
  board: string[];
  player1Uid: string;
  player2Uid: string;
  player1Name: string;
  player2Name: string;
  startedUid: string;
  currentTurnUid: string;
  status: 'ongoing' | 'won' | 'draw';
  rounds: Round[] | null;
  leftGamePlayer1Uid: string | null;
  leftGamePlayer2Uid: string | null;
}

export interface Round {
  round: number;
  moves: Move[];
}

export interface Move {
  message: string;
  type: 'normal' | 'win' | 'draw';
}
