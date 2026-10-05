import * as React from "react";
import { GLOBAL_POPULATION_2024 } from "@optimitron/data/parameters";
import { EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME } from "@optimitron/db/system-identities";
import type { ParameterValueProps } from "../components/shared/ParameterValue";
import {
  FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM,
  FLOW_REFERRALS_PER_VOTER,
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
            {EARTH_OPTIMIZATION_SERVICES_LEGAL_NAME} You are responsible for{" "}
            <ParameterValue
              className="font-black"
              figures={1}
              param={GLOBAL_POPULATION_2024}
            />{" "}
            humans. Start with{" "}
            <ParameterValue
              param={FLOW_REFERRALS_PER_VOTER}
              presentation="inline"
              valueOverride="two"
            />
            : get them to vote. They each get{" "}
            <ParameterValue
              param={FLOW_REFERRALS_PER_VOTER}
              presentation="inline"
              valueOverride="two"
            />{" "}
            more. After{" "}
            <ParameterValue
              className="font-black"
              display="integer"
              param={FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM}
            />{" "}
            rounds of that, most of humanity has voted to end war and disease.
          </PromoText>
        </PromoBody>
      </>
    );
  };
}
