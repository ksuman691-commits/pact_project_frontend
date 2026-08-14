// Content library for the "Create a Circle" tap-flow.
// Reuses the same 10-vibe taxonomy already defined for Create Pact —
// no separate category list for Circles.

import type { VibeId } from '@/types/createPactFlow';
import type { PrivacyOption } from '@/types/createCircleFlow';

export { VIBES } from '@/lib/createPactFlow/content';

// 4 generated name-suggestion chips per vibe — softens the one genuinely
// required free-text field (Circle name) by giving the user something to
// tap instead of type.
export const NAME_TEMPLATES: Record<VibeId, string[]> = {
  glowup: ['Glow Up Crew', 'The Glow Getters', 'Level Up Circle', 'New Me Collective'],
  money: ['Money Moves', 'The Rich List', 'Save & Stack', 'Wealth Builders'],
  dare: ['The Dare Devils', 'No Excuses Club', 'Scared but Doing It', 'Fear Fighters'],
  adventure: ['Wanderers', 'The Adventure Club', 'Passport Stamps', 'Off the Map'],
  love: ['The Inner Circle', 'Ride or Die', 'Family First', 'Us Against the World'],
  social: ['The Regulars', 'Out & About', 'Social Circle', 'The Squad'],
  create: ['The Studio', 'Makers Circle', 'Creative Collective', 'Work in Progress'],
  build: ['Builders Guild', 'The Founders', 'Shipping Fast', 'Idea to Launch'],
  levelup: ['Level Up Club', 'The Learners', 'Sharper Every Day', 'Brain Gains'],
  wellbeing: ['The Wellness Circle', 'Take Care Crew', 'Slow Mornings', 'Rest & Reset'],
};

export const CIRCLE_EMOJIS = ['🚀', '💪', '💻', '📚', '⚡', '👥', '🎯', '🔥', '🌱', '🧠', '✨', '❤️', '🎨', '🌎', '🎉'];

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  { id: 'open', emoji: '🌎', label: 'Open', desc: 'Anyone can find and join instantly' },
  { id: 'approval', emoji: '🖐️', label: 'Approval required', desc: 'Anyone can request — you approve' },
  { id: 'invite_only', emoji: '🔒', label: 'Invite only', desc: 'Only people you invite can join' },
];

export const CIRCLE_VIBE_TAGLINES: Record<VibeId, string> = {
  glowup: 'Show up for each other, every day.',
  money: 'Get accountable about money together.',
  dare: 'Push each other past scared.',
  adventure: 'Collect stories together.',
  love: 'The people who show up for you.',
  social: 'More people. More stories. More life.',
  create: 'Make things worth showing, together.',
  build: 'Build something real, together.',
  levelup: 'Get sharper, together.',
  wellbeing: 'Take care of each other.',
};
