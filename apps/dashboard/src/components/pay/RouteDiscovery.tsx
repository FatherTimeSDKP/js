"use client";

import type { Project } from "@/api/projects";
import { type Fee, updateFee } from "@/api/universal-bridge/developer";
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
import { useMutation } from "@tanstack/react-query";
import { NetworkSelectorButton } from "components/selects/NetworkSelectorButton";
import {
  type ApiKeyPayConfigValidationSchema,
  apiKeyPayConfigValidationSchema,
} from "components/settings/ApiKeys/validations";
import { useTrack } from "hooks/analytics/useTrack";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PayConfigProps {
  project: Project;
  teamId: string;
  teamSlug: string;
  fees: Fee;
}

const TRACKING_CATEGORY = "pay";

export const RouteDiscovery: React.FC<PayConfigProps> = (props) => {
  const form = useForm<ApiKeyPayConfigValidationSchema>({
    resolver: zodResolver(apiKeyPayConfigValidationSchema),
    values: {
      payoutAddress: props.fees.feeRecipient ?? "",
      developerFeeBPS: props.fees.feeBps ? props.fees.feeBps / 100 : 0,
    },
  });

  const trackEvent = useTrack();

  const updateFeeMutation = useMutation({
    mutationFn: async (values: {
      payoutAddress: string;
      developerFeeBPS: number;
    }) => {
      await updateFee({
        clientId: props.project.publishableKey,
        teamId: props.teamId,
        feeRecipient: values.payoutAddress,
        feeBps: values.developerFeeBPS,
      });
    },
  });

  const handleSubmit = form.handleSubmit(
    ({ payoutAddress, developerFeeBPS }) => {
      updateFeeMutation.mutate(
        {
          payoutAddress,
          developerFeeBPS: developerFeeBPS ? developerFeeBPS * 100 : 0,
        },
        {
          onSuccess: () => {
            toast.success("Fee sharing updated");
            trackEvent({
              category: TRACKING_CATEGORY,
              action: "configuration-update",
              label: "success",
              data: {
                payoutAddress,
              },
            });
          },
          onError: (err) => {
            toast.error("Failed to update fee sharing");
            console.error(err);
            trackEvent({
              category: TRACKING_CATEGORY,
              action: "configuration-update",
              label: "error",
              error: err,
            });
          },
        },
      );
    },
    (errors) => {
      console.log(errors);
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <RouteDiscoveryCard
          bottomText=""
          errorText={form.getFieldState("payoutAddress").error?.message}
          saveButton={{
            type: "submit",
            disabled: !form.formState.isDirty,
            isPending: updateFeeMutation.isPending,
            variant: "primary",
          }}
          noPermissionText={undefined}
        >
          <div>
            <h3 className="font-semibold text-xl tracking-tight">
              Don't see your token listed?
            </h3>
            <p className="mt-1.5 mb-4 text-foreground text-sm">
              Select your chain and input the token address to automatically
              kick-off the toke route discovery process. Please check back on
              this page within 20-40 minutes of submitting this form.
            </p>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="blockchain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blockchain</FormLabel>
                    <NetworkSelectorButton />
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
          </div>
        </RouteDiscoveryCard>
      </form>
    </Form>
  );
};
