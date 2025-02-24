export type TokenPayload = {
  username: string;
  userId: string;
  teamId: string;
  domain: string;
  isAdmin: boolean;
  level: number;
};

export type UserDB = {
  username: string;
  userId: string;
  teamId: string;
  domain: string;
  isAdmin: boolean;
  level: number;
};

export type AppSession = {
  token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
};
