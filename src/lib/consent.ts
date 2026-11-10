import { PRIVACY_VERSION } from '@/content/privacy';
import { TERMS_VERSION } from '@/content/terms';

/** What the person chose on the consent notice (DPDP Act s.6). The optional choices start off. */
export interface ConsentChoices {
  accepted: boolean;
  ai_training: boolean;
  ads_sharing: boolean;
}

export const EMPTY_CONSENT: ConsentChoices = { accepted: false, ai_training: false, ads_sharing: false };

/** The fields the backend records, with the versions of the texts the person was shown. */
export function consentPayload(choices: ConsentChoices) {
  return {
    accepted_terms: choices.accepted,
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    ai_training: choices.ai_training,
    ads_sharing: choices.ads_sharing,
  };
}

/** The backend's answer when the page shows an older version of the texts than it has. */
export function isPolicyVersionMismatch(error: any): boolean {
  return error?.response?.status === 409 && error?.response?.data?.detail?.code === 'policy_version_mismatch';
}
