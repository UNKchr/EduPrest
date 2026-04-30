let accesToken: string | null = null;

export const tokenStore = {
  get: () => accesToken,
  set: (token: string | null) => {
    accesToken = token;
  },
  clear: () => {
    accesToken = null;
  }
}