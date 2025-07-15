

// async isSupervisorLoggedIn(): Promise<boolean> {
//   try {
//     const activeSessions = await this.sessionModel.find({ logoutTime: null });
//     if (!activeSessions.length) return false;
//     const userIds = activeSessions.map(session => session.userId);
//     const supervisorExists = await this.userModel.exists({ //check if any of those users is a supervisor with user schema 
//       _id: { $in: userIds },
//       role: 'supervisor',
//     });

//     return !!supervisorExists;
//   } catch (error) {
//     console.error('Error checking supervisor login status:', error);
//     return false;
//   }
// }













// export async function checkSupervisorLogin(
//     sessionsService: SessionsService
//   ): Promise<boolean> {
//     try {
 //     const activeSessions = await this.sessionModel.find({ logoutTime: null });
//     if (!activeSessions.length) return false;

//       return activeSessions.some(session =>
// we can use populate to get the role from user schema based on the user id but it is like join query so we cannot use it here
//                (session.userId as any).role === Role.SUPERVISOR
//       );
//     } catch (error) {
//       console.error('Error checking supervisor login status:', error);
//       return false;
//     }
//   }
