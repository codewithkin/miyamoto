import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

/**
 * The rewarded ad behind "Watch an ad for +1".
 *
 * The extra question is granted by the server, not here — this only
 * resolves whether the reward was actually earned. Granting on the device
 * would make the counter negotiable, which is the one thing it cannot be.
 *
 * Test unit ids are used until real ones exist; swapping them is a one-line
 * change and the flow is otherwise identical.
 */

const REWARDED_UNIT_ID = TestIds.REWARDED;

/**
 * Loads and shows one rewarded ad.
 *
 * Resolves true only if the user watched far enough to earn the reward —
 * closing early resolves false, and so does any load or show failure, so a
 * broken ad network can never hand out free questions.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    let earned = false;
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(value);
    };

    const subs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];

    function unsubscribe() {
      for (const s of subs) s();
    }

    // A network that never calls back must not leave the sheet spinning.
    setTimeout(() => finish(earned), 45_000);

    ad.load();
  });
}
