import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

export function TreatyTradeThesis() {
  return (
    <>
      humanity should redirect one percent of military spending from weapons
      capable of causing{" "}
      <ParameterValue
        param={NUCLEAR_WINTER_OVERKILL_FACTOR}
        display="integer"
      />{" "}
      apocalypses to compress the disease-eradication timeline from{" "}
      <ParameterValue
        param={STATUS_QUO_QUEUE_CLEARANCE_YEARS}
        display="integer"
      />{" "}
      years to{" "}
      <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" />{" "}
      years
    </>
  );
}
