import * as React from "react";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_POPULATION_2024,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME } from "@optimitron/db/system-identities";
import type { ParameterValueProps } from "../components/shared/ParameterValue";
import {
  FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_REFERRALS_PER_VOTER,
  FLOW_TOTAL_LIVES_SAVED,
  FLOW_TOTAL_SUFFERING_HOURS,
} from "./treaty-share-flow-parameters";

type ParameterValueComponent = React.ComponentType<ParameterValueProps>;
type PromoTextComponent = React.ComponentType<{
  children: React.ReactNode;
  muted?: boolean;
}>;
type PromoBlockComponent = React.ComponentType<{ children: React.ReactNode }>;

interface HumanityManagerPromotionComponents {
  ParameterValue: ParameterValueComponent;
  PromoBody: PromoBlockComponent;
  PromoEyebrow: PromoBlockComponent;
  PromoText: PromoTextComponent;
}

export function createHumanityManagerPromotion({
  ParameterValue,
  PromoBody,
  PromoEyebrow,
  PromoText,
}: HumanityManagerPromotionComponents) {
  return function HumanityManagerPromotion() {
    return (
      <>
        <PromoEyebrow>Humanity Manager · Assignment 1</PromoEyebrow>
        <PromoBody>
          <PromoText>
            🥳Congratulations! You&apos;ve been promoted to Humanity Manager at{" "}
            {EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME}. You are responsible for
            getting{" "}
            <ParameterValue
              className="font-black"
              figures={1}
              param={GLOBAL_POPULATION_2024}
            />{" "}
            humans to agree to trade one of Earth&apos;s{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses worth of mass murder capacity for{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            />
            × more clinical trials, compressing the disease eradication timeline
            from{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
            />{" "}
            years to{" "}
            <ParameterValue
              className="font-black"
              figures={2}
              param={DFDA_QUEUE_CLEARANCE_YEARS}
            />
            .
          </PromoText>
          <PromoText>
            Optimize Earth — save{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={FLOW_TOTAL_LIVES_SAVED}
            />{" "}
            lives and prevent{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={FLOW_TOTAL_SUFFERING_HOURS}
            />{" "}
            hours of suffering by telling all your friends! Earth optimization
            starts with you. Send this message to{" "}
            <ParameterValue
              param={FLOW_REFERRALS_PER_VOTER}
              presentation="inline"
              valueOverride="two"
            />{" "}
            humans you love. They send it to{" "}
            <ParameterValue
              param={FLOW_REFERRALS_PER_VOTER}
              presentation="inline"
              valueOverride="two"
            />{" "}
            more and after{" "}
            <ParameterValue
              className="font-black"
              display="integer"
              param={FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM}
            />{" "}
            of these doublings, the majority of humanity has agreed to transcend
            war and disease!
          </PromoText>
        </PromoBody>
      </>
    );
  };
}
