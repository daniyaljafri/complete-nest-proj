/**
 * Short function to check if supervisor is logged in based on timestamps
 * Logic: lastLoginTime > lastLogoutTime = logged in
 */
export function isSupervisorLoggedIn(lastLoginTime?: Date, lastLogoutTime?: Date): boolean {
  // No login time = never logged in
  if (!lastLoginTime) return false;
  
  // Has login but no logout = logged in
  if (!lastLogoutTime) return true;
  
  // Compare timestamps
  return lastLoginTime > lastLogoutTime;
} 