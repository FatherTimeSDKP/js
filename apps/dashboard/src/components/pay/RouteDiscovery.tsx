"use client";

import type { Project } from "@/api/projects";
import type { Fee } from "@/api/universal-bridge/developer";
import { RouteDiscoveryCard } from "@/components/blocks/RouteDiscoveryCard";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { NetworkSelectorButton } from "components/selects/NetworkSelectorButton";
import {
  type RouteDiscoveryValidationSchema,
  routeDiscoveryValidationSchema,
} from "components/settings/ApiKeys/validations";
import { useTrack } from "hooks/analytics/useTrack";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface PayConfigProps {
  project: Project;
  teamId: string;
  teamSlug: string;
  fees: Fee;
}

const TRACKING_CATEGORY = "pay";

export const RouteDiscovery: React.FC<PayConfigProps> = (props) => {
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const form = useForm<RouteDiscoveryValidationSchema>({
    resolver: zodResolver(routeDiscoveryValidationSchema),
    defaultValues: {
      tokenAddress: "",
    },
  });

  const trackEvent = useTrack();

  const handleSubmit = form.handleSubmit(
    () => {
      console.log("Button pressed");
      setIsSubmitSuccess(true);
    },
    (errors) => {
      console.log(errors);
    },
  );

  // Success component shown after successful submission
  const SuccessComponent = () => (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
      <h4 className="text-green-600 font-medium text-lg">
        Token submitted successfully!
      </h4>
      <p className="text-green-600">
        Thank you for your submission. If you still do not see your token listed
        after some time, please reach out to our team for support.
      </p>
    </div>
  );

  return (
    <RouteDiscoveryCard
      bottomText=""
      saveButton={
        !isSubmitSuccess
          ? {
              type: "submit",
              form: "route-discovery-form", // Connect to form by ID
              disabled: !form.formState.isDirty || form.formState.isSubmitting,
              variant: "primary",
            }
          : undefined
      }
      noPermissionText={undefined}
    >
      <div>
        <h3 className="font-semibold text-xl tracking-tight">
          Don't see your token listed?
        </h3>
        <p className="mt-1.5 mb-4 text-foreground text-sm">
          Select your chain and input the token address to automatically
          kick-off the token route discovery process. Please check back on this
          page within 20-40 minutes of submitting this form.
        </p>

        {isSubmitSuccess ? (
          // Show success message after successful submission
          <SuccessComponent />
        ) : (
          // Show form when not yet successfully submitted
          <Form {...form}>
              <form onSubmit={handleSubmit} autoComplete="off">
              autoComplete="off"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="blockchain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blockchain</FormLabel>
                      <FormControl>
                        <NetworkSelectorButton
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tokenAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Address</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input {...field} placeholder="0x..." />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}
      </div>
    </RouteDiscoveryCard>
  );
};
