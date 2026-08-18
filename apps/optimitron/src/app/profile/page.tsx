import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OpenTaskRequestAction } from "@/components/people/OpenTaskRequestAction";
import {
  MissionProfileForm,
  MissionQuestionsClient,
} from "@/components/missions/MissionClient";
import { ProfileIdentityClient } from "@/components/profile/ProfileIdentityClient";
import { PublicProfileTaskSection } from "@/components/tasks/PublicProfileTaskSection";
import { authOptions } from "@/lib/auth";
import {
  getDatingQuestionsData,
  getOwnDatingProfile,
} from "@/lib/dating.server";
import { getUserPersonHref } from "@/lib/person-href";
import { getProfileIdentityData } from "@/lib/profile-identity.server";
import { getSignInPath, editProfileLink, ROUTES } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { getUserDisplayName } from "@/lib/user-display";

export const metadata = getRouteMetadata(editProfileLink);

async function loadMissionProfile(userId: string) {
  try {
    return await getOwnDatingProfile(userId);
  } catch {
    return null;
  }
}

async function loadMissionQuestions(userId: string) {
  try {
    return await getDatingQuestionsData(userId);
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    redirect(getSignInPath(ROUTES.profile));
  }

  const [data, missionProfile] = await Promise.all([
    getProfileIdentityData(userId),
    loadMissionProfile(userId),
  ]);

  if (!data) {
    redirect(getSignInPath(ROUTES.profile));
  }

  const [publicTaskData, missionQuestions] = await Promise.all([
    data.user.person
      ? getPersonTaskProfileData(data.user.person.id, userId)
      : Promise.resolve(null),
    missionProfile ? loadMissionQuestions(userId) : Promise.resolve(null),
  ]);
  const availableAuthProviderIds = authOptions.providers.map((provider) => provider.id);
  const publicProfileHref = getUserPersonHref(data.user);

  return (
    <>
      <ProfileIdentityClient
        initialUser={data.user}
        socialAccounts={data.socialAccounts}
        availableAuthProviderIds={availableAuthProviderIds}
        linkedAuthProviderIds={data.linkedAuthProviderIds}
      />
      <div className="mx-auto max-w-4xl px-4 pb-12">
        <PublicProfileTaskSection
          assignedByTasks={publicTaskData?.assignedByOpenTasks ?? []}
          completedTasks={publicTaskData?.completedTasks ?? []}
          heading="Your Public Tasks"
          intro="This is how other humans help you find and complete the highest-value actions to end war and disease."
          openTasks={publicTaskData?.openTasks ?? []}
          ownerName={getUserDisplayName(data.user)}
          profileHref={publicProfileHref}
          requestAction={
            publicProfileHref ? (
              <OpenTaskRequestAction
                buttonLabel="Ask for help"
                callbackUrl={ROUTES.profile}
                isAuthenticated={Boolean(userId)}
                signInHref={getSignInPath(ROUTES.profile)}
              />
            ) : null
          }
          requestedTasks={publicTaskData?.requestedOpenTasks ?? []}
        />
        <section className="scroll-mt-24 border-t-2 border-foreground py-10" id="missions">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Missions
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">
              Find someone to optimize Earth with.
            </h2>
            <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
              This is the part of your profile that only exists for Earth
              Optimization Missions: who should find you, what you might do
              together, and whether romance is permitted to make itself useful.
            </p>
          </div>
          <div className="mt-6">
            <MissionProfileForm profile={missionProfile} />
          </div>
          {missionQuestions?.questions.length ? (
            <div className="mt-8">
              <h3 className="text-2xl font-black uppercase">
                Mission questions
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Answer what you believe and what you can tolerate. Matching is
                easier when the dealbreakers are not discovered during dessert.
              </p>
              <div className="mt-4">
                <MissionQuestionsClient questions={missionQuestions.questions} />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
