import * as React from "react";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_POPULATION_2024,
  GLOBAL_WARHEAD_COUNT,
  NUCLEAR_WINTER_WARHEAD_THRESHOLD,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import type { ParameterValueProps } from "@/components/shared/ParameterValue.core";
import { ROUTES } from "@/lib/routes";
import {
  FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM,
  FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR,
  FLOW_REFERRALS_PER_VOTER,
} from "@/lib/treaty-share-flow-parameters";

type ParameterValueComponent = React.ComponentType<ParameterValueProps>;
type PromoLinkComponent = React.ComponentType<{
  href: string;
  children: React.ReactNode;
}>;
type PromoTextComponent = React.ComponentType<{
  children: React.ReactNode;
  muted?: boolean;
}>;
type PromoBlockComponent = React.ComponentType<{ children: React.ReactNode }>;

interface HumanityManagerPromotionComponents {
  ParameterValue: ParameterValueComponent;
  PromoBody: PromoBlockComponent;
  PromoEyebrow: PromoBlockComponent;
  PromoHeading: PromoBlockComponent;
  PromoLink: PromoLinkComponent;
  PromoText: PromoTextComponent;
}

export function createHumanityManagerPromotion({
  ParameterValue,
  PromoBody,
  PromoEyebrow,
  PromoHeading,
  PromoLink,
  PromoText,
}: HumanityManagerPromotionComponents) {
  return function HumanityManagerPromotion() {
    return (
      <>
        <PromoEyebrow>Humanity Manager · Assignment 1</PromoEyebrow>
        <PromoHeading>
          Trade one apocalypse for{" "}
          <ParameterValue
            className="font-black"
            figures={3}
            param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
          />
          × more clinical trials.
        </PromoHeading>
        <PromoBody>
          <PromoText>
            You have been promoted to Humanity Manager at Earth Optimization
            Services LLC. Responsible for{" "}
            <ParameterValue
              className="font-black"
              figures={1}
              param={GLOBAL_POPULATION_2024}
            />{" "}
            humans. First task: get them to ratify the{" "}
            <PromoLink href={ROUTES.treaty}>1% Treaty</PromoLink>.
          </PromoText>
          <PromoText>
            Earth owns{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={GLOBAL_WARHEAD_COUNT}
            />{" "}
            nuclear warheads.{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={NUCLEAR_WINTER_WARHEAD_THRESHOLD}
            />{" "}
            of them ends civilization. That is{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
            />{" "}
            apocalypses on the shelf. Spend one apocalypse on{" "}
            <ParameterValue
              className="font-black"
              figures={3}
              param={DFDA_TRIAL_CAPACITY_MULTIPLIER}
            />
            × more clinical trials and the disease-eradication timeline
            collapses from{" "}
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
          <PromoText muted>
            To get there: send the message below to{" "}
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
            />
            .{" "}
            <ParameterValue
              display="integer"
              param={FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM}
              presentation="inline"
            />{" "}
            rounds reaches every adult on Earth. Getting humans to agree on one
            thing is the first step to any civilizational upgrade. You are
            responsible for this step. It cannot be completed without you.
          </PromoText>
        </PromoBody>
      </>
    );
  };
}
