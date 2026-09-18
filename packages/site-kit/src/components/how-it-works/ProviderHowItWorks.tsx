import { ProviderSteps } from "./ProviderSteps";

export function ProviderHowItWorks() {
  return (
    <div className="relative mt-12 mb-16" id="how-it-works-provider">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h3 className="mb-8 text-center text-2xl font-bold underline decoration-2 underline-offset-8">
          How it Works For Providers
        </h3>

        <ProviderSteps />
      </div>
    </div>
  );
}
