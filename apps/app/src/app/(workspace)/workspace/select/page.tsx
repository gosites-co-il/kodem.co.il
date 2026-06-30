import { WorkspaceSelectForm } from '../../../../components/workspace/workspace-select-form';
import { AuthGate } from '../../../../components/auth/auth-gate';

export default function WorkspaceSelectPage() {
  return (
    <AuthGate>
      <WorkspaceSelectForm />
    </AuthGate>
  );
}
