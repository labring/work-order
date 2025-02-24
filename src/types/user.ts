export const subscriptionMap = {
  free: 0,
  experience: 1,
  team: 2,
  enterprise: 3,
  custom: 4
};

// export const subscriptionLevelList = [{ id: 'free', label: 'free' }];
export const subscriptionLevelList = Object.keys(subscriptionMap).map((item) => ({
  id: item,
  label: item
}));

export type TokenPayload = {
  username: string;
  userId: string;
  teamId: string;
  domain: string;
  isAdmin: boolean;
  subscription: string;
};

export type UserDB = {
  username: string;
  userId: string;
  teamId: string;
  domain: string;
  isAdmin: boolean;
  subscription: number;
};

export type AppSession = {
  token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
};
