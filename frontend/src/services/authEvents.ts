type LogoutHandler = () => void;

let onLogout: LogoutHandler | null = null;

export const setOnLogout = (handler: LogoutHandler) => {
  onLogout = handler;
};

export const triggerLogout = () => {
  onLogout?.();
};