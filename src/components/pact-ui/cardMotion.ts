import type { Variants } from 'framer-motion';

/**
 * Shared framer-motion variants matching FeedPactCard's entrance/hover/tap
 * physics, so Circle and Profile cards feel consistent with Feed.
 */

export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const cardHoverTap = {
  whileHover: { y: -3, transition: { duration: 0.15, ease: 'easeOut' } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const listContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};
