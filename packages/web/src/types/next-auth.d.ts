import type { PersonhoodProviderValue } from "@/lib/personhood";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      countryCode?: string | null;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      personId?: string | null;
      personhoodProvider?: PersonhoodProviderValue | null;
      personhoodVerificationLevel?: string | null;
      personhoodVerified?: boolean;
      personhoodVerifiedAt?: string | null;
      referralCode?: string;
      username?: string | null;
      verifiedProviders?: PersonhoodProviderValue[];
    };
  }

  interface User {
    id: string;
    countryCode?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    personId?: string | null;
    personhoodProvider?: PersonhoodProviderValue | null;
    personhoodVerificationLevel?: string | null;
    personhoodVerified?: boolean;
    personhoodVerifiedAt?: string | null;
    referralCode?: string;
    username?: string | null;
    verifiedProviders?: PersonhoodProviderValue[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    countryCode?: string | null;
    personId?: string | null;
    personhoodProvider?: PersonhoodProviderValue | null;
    personhoodVerificationLevel?: string | null;
    personhoodVerified?: boolean;
    personhoodVerifiedAt?: string | null;
    referralCode?: string;
    username?: string | null;
    verifiedProviders?: PersonhoodProviderValue[];
  }
}
