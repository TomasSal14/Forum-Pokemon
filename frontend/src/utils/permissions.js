/**
 * Returns true if the current user can delete or moderate a resource.
 * Admins and mods can moderate everything; regular users can only act
 * on content they created.
 */
export const canModerate = (currentUser, creatorId) =>
  Boolean(currentUser) &&
  (currentUser.id === creatorId ||
    currentUser.profile === 'mod' ||
    currentUser.profile === 'admin');
