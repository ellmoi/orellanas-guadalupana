export function serializeUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  delete safeUser.refreshSessions;
  return {
    ...safeUser,
    roles: user.roles?.map((assignment) => assignment.role?.slug).filter(Boolean) || [],
  };
}
