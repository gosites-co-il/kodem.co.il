import {
  Member,
  User,
  UserId,
  WorkspaceId,
  WorkspaceInvite,
} from '@kodem/contracts';

/**
 * Mirrors MemberService.acceptInvite email gate for unit coverage without DB.
 */
export function assertInviteEmailMatches(
  inviteEmail: string,
  userEmail: string,
): void {
  if (userEmail.toLowerCase() !== inviteEmail.toLowerCase()) {
    throw new Error('Invite email does not match the signed-in user');
  }
}

describe('member invite accept email gate', () => {
  const invite: Pick<WorkspaceInvite, 'email'> = {
    email: 'invitee@example.com',
  };
  const matchingUser: Pick<User, 'email' | 'id'> = {
    id: 'usr_1' as UserId,
    email: 'Invitee@Example.com',
  };
  const wrongUser: Pick<User, 'email' | 'id'> = {
    id: 'usr_2' as UserId,
    email: 'other@example.com',
  };

  it('rejects when user email does not match invite', () => {
    expect(() =>
      assertInviteEmailMatches(invite.email, wrongUser.email),
    ).toThrow(/does not match/);
  });

  it('allows case-insensitive email match', () => {
    expect(() =>
      assertInviteEmailMatches(invite.email, matchingUser.email),
    ).not.toThrow();
  });

  it('documents membership shape for accept flow', () => {
    const member: Member = {
      id: 'mem_1' as Member['id'],
      workspaceId: 'ws_1' as WorkspaceId,
      userId: matchingUser.id,
      role: 'member',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(member.role).toBe('member');
  });
});
