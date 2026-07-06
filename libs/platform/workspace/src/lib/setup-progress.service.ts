import type {
  SetupDiscoveryFinding,
  SetupProgressTask,
  WorkspaceSetupData,
} from '@kodem/contracts';

const PREPARATION_TASKS: Omit<SetupProgressTask, 'status'>[] = [
  { id: 'workspace', label: 'מסיימים הגדרת סביבה' },
  { id: 'crm', label: 'מכינים CRM' },
  { id: 'knowledge', label: 'מחברים לפרופיל העסק' },
  { id: 'insights', label: 'מפעילים תובנות' },
  { id: 'discovery', label: 'מעשירים ידע עסקי' },
  { id: 'recommendations', label: 'מכינים המלצות' },
  { id: 'ai', label: 'מכווננים בינה מלאכותית' },
];

export class SetupProgressService {
  buildPreparationTasks(completedCount = 0): SetupProgressTask[] {
    return PREPARATION_TASKS.map((task, index) => ({
      ...task,
      status:
        index < completedCount
          ? 'completed'
          : index === completedCount
            ? 'running'
            : 'pending',
    }));
  }

  buildDiscoveryFindings(
    setup: WorkspaceSetupData,
  ): SetupDiscoveryFinding[] {
    const discovered = setup.discovered;
    const profile = setup.confirmedProfile;
    const hasWebsite = Boolean(profile?.website ?? setup.business?.websiteUrl);

    return [
      {
        id: 'profile',
        label: 'פרופיל עסק מאושר',
        status: profile?.businessName ? 'completed' : 'pending',
      },
      {
        id: 'website',
        label: 'אתר מקושר',
        status: hasWebsite ? 'completed' : 'pending',
      },
      {
        id: 'industry',
        label: 'תחום פעילות',
        status: profile?.industry || discovered?.industry?.value
          ? 'completed'
          : 'pending',
      },
      {
        id: 'description',
        label: 'תיאור עסק',
        status: profile?.description || discovered?.description?.value
          ? 'completed'
          : 'pending',
      },
      {
        id: 'contact',
        label: 'פרטי קשר',
        status:
          (profile?.emails?.length ?? 0) > 0 || (profile?.phones?.length ?? 0) > 0
            ? 'completed'
            : 'pending',
      },
      {
        id: 'knowledge',
        label: 'בסיס ידע מחובר לפרופיל',
        status: setup.preparationTasks?.some((t) => t.id === 'knowledge' && t.status === 'completed')
          ? 'completed'
          : 'running',
      },
      {
        id: 'recommendations',
        label: 'המלצות ראשונות בהכנה',
        status: 'running',
      },
    ];
  }

  defaultModules(): WorkspaceSetupData['modules'] {
    return {
      activated: ['crm', 'knowledge', 'insights', 'digital_card'],
    };
  }

  defaultAi(): WorkspaceSetupData['ai'] {
    return { provider: 'kodem' };
  }
}
