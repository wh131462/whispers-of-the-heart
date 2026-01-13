// 认证相关 hooks
export { useAuth } from './useAuth';

// 数据请求 hooks
export { useFetch, usePost } from './useFetch';

// 本地存储 hooks
export {
  useLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
} from './useLocalStorage';

// P2P 联机相关 hooks
export { useTrysteroRoom } from './useTrysteroRoom';
export { useOnlineGame } from './useOnlineGame';

// 类型导出
export type { User, AuthState } from './useAuth';
export type { FetchState, UseFetchOptions } from './useFetch';
export type {
  BasePeerInfo,
  RoomConfig,
  TrysteroRoomState,
  ActionSender,
  ActionReceiver,
} from './useTrysteroRoom';
export type {
  PlayerRole,
  OnlinePlayer,
  OnlineGameState,
  UseOnlineGameOptions,
  PendingSwapRequest,
} from './useOnlineGame';
