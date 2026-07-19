// Auth hooks
export { useRequireAuth } from './useRequireAuth';

// Pact hooks
export {
  usePacts,
  usePact,
  usePactProofHistory,
  usePactAnalytics,
  useTodaysPacts,
  useActivePacts,
  useInfinitePublicPacts,
  useShortsFeed,
} from './usePacts';

export {
  useCreatePact,
  useUpdatePact,
  useUploadPactProof,
  useJoinPact,
  useApprovePactJoinRequest,
  useRejectPactJoinRequest,
  useLeavePact,
  useLikePact,
  useUnlikePact,
  useAddComment,
  useDeleteComment,
  useSharePact,
  useSubmitVerification,
} from './usePactMutations';

// Circle hooks
export {
  useCircles,
  useCircle,
  useCircleMembers,
  usePublicCircles,
  useSearchCircles,
  useCircleLeaderboard,
  useCirclePactsList,
} from './useCircles';

export {
  useCreateCircle,
  useJoinCircle,
  useLeaveCircle,
  useApproveCircleJoinRequest,
  useRejectCircleJoinRequest,
  useInviteUserToCircle,
  useRemoveCircleMember,
} from './useCircleMutations';

// Wallet hooks
export {
  useWallet,
  useWalletBalance,
  useWalletLocked,
  useWalletRewards,
  useWalletTransactions,
  useWalletHistory,
  useWalletWithdrawalRequests,
} from './useWallet';

export {
  useDeposit,
  useWithdraw,
  useInitiateWithdrawal,
} from './useWalletMutations';

// User hooks
export {
  useUser,
  useUserByUsername,
  useUserStats,
  useUserFollowers,
  useUserFollowing,
  useUserAnalytics,
  useSearchUsers,
} from './useUserQueries';

export {
  useUpdateUser,
} from './useUserMutations';

// Feed hooks
export {
  usePersonalizedFeed,
  useTrendingFeed,
  useDiscoverFeed,
  useFollowingFeed,
  useShortsVideoFeed,
  usePublicPacts,
  useUserPacts,
  useCirclePacts,
  useSearchPacts,
  usePactComments,
  usePactLikes,
} from './useFeedQueries';

// Verification hooks
export {
  useVerificationByPact,
  useVerificationByUser,
  useVerificationStats,
  usePactVerificationStats,
} from './useVerificationQueries';

// Leaderboard hooks
export {
  useGlobalLeaderboard,
  useCircleLeaderboard as useCircleLeaderboardInfinite,
  useTrendingLeaderboard,
} from './useLeaderboards';

// Notification hooks
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from './useNotifications';

// Follow hooks
export {
  useFollowState,
  usePendingFollowRequests,
  useFollowers,
  useFollowing,
  useRequestFollow,
  useAcceptFollow,
  useRejectFollow,
  useRemoveFollow,
} from './useFollows';
