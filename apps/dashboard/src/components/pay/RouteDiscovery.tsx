"use client";

import type { Project } from "@/api/projects";
import { addUniversalBridgeTokenRoute } from "@/api/universal-bridge/addRoute"; // Adjust the import path
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
import { useMutation } from "@tanstack/react-query";
import { NetworkSelectorButton } from "components/selects/NetworkSelectorButton";
import {
  type RouteDiscoveryValidationSchema,
  routeDiscoveryValidationSchema,
} from "components/settings/ApiKeys/validations";
import { useTrack } from "hooks/analytics/useTrack";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface RouteDiscoveryProps {
  project: Project;
  teamId: string;
  teamSlug: string;
  fees: Fee;
}

const TRACKING_CATEGORY = "token_discovery";

export const RouteDiscovery: React.FC<RouteDiscoveryProps> = () => {
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isSubmitFail, setIsSubmitFailed] = useState(false);

  // State to track the selected chain ID directly from the NetworkSelectorButton
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>(
    undefined,
  );

  const form = useForm<RouteDiscoveryValidationSchema>({
    resolver: zodResolver(routeDiscoveryValidationSchema),
    defaultValues: {
      chainId: 1,
      tokenAddress: "",
    },
  });

  const trackEvent = useTrack();

  const submitDiscoveryMutation = useMutation({
    mutationFn: async (values: {
      tokenAddress: string;
    }) => {
      try {
        // Call the API to add the route
        const result = await addUniversalBridgeTokenRoute({
          chainId: selectedChainId,
          tokenAddress: values.tokenAddress,
        });

        return result;
      } catch (error) {
        console.error("Error adding route:", error);
        throw error; // Re-throw to trigger onError handler
      }
    },
  });

  const handleSubmit = form.handleSubmit(
    ({ tokenAddress }) => {
      console.log("selectedChainId", selectedChainId);
      submitDiscoveryMutation.mutate(
        {
          tokenAddress,
        },
        {
          onSuccess: (data) => {
            setIsSubmitSuccess(true);
            toast.success("Token submitted for discovery");
            console.log("Token route added successfully:", data);
            trackEvent({
              category: TRACKING_CATEGORY,
              action: "token-discovery-submit",
              label: "success",
              data: {
                tokenAddress,
                tokenCount: data?.length || 0,
              },
            });
          },
          onError: (err) => {
            setIsSubmitFailed(true);
            toast.error("Token Submission Failed");
            console.error("Token route addition failed:", err);

            // Get appropriate error message
            let errorMessage = "An unknown error occurred";
            if (err instanceof Error) {
              errorMessage = err.message;
            }

            trackEvent({
              category: TRACKING_CATEGORY,
              action: "token-discovery-submit",
              label: "error",
              error: errorMessage,
            });
          },
        },
      );
    },
    (errors) => {
      console.log("Form validation errors:", errors);
      toast.error("Please fix the form errors before submitting");
    },
  );

  // Success component shown after successful submission
  const SuccessComponent = () => (
    <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
      <h4 className="font-medium text-green-600 text-lg">
        Token submitted successfully!
      </h4>
      <p className="mb-3 text-green-600">
        Thank you for your submission. If you still do not see your token listed
        after some time, please reach out to our team for support.
      </p>
    </div>
  );

  // Failure component shown after submission fails
  const FailComponent = () => (
    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
      <h4 className="font-medium text-lg text-red-600">
        Token submission failed!
      </h4>
      <p className="mb-2 text-red-600">
        Please double check the network and token address. If issues persist,
        please reach out to our support team.
        {submitDiscoveryMutation.error instanceof Error && (
          <span className="mt-1 block text-sm">
            Error: {submitDiscoveryMutation.error.message}
          </span>
        )}
      </p>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <RouteDiscoveryCard
          bottomText=""
          errorText={form.getFieldState("tokenAddress").error?.message}
          saveButton={{
            type: "submit",
            disabled: !form.formState.isDirty,
            isPending: submitDiscoveryMutation.isPending,
          }}
          noPermissionText={undefined}
        >
          <div>
            <h3 className="font-semibold text-xl tracking-tight">
              Don't see your token listed?
            </h3>
            <p className="mt-1.5 mb-4 text-foreground text-sm">
              Select your chain and input the token address to automatically
              kick-off the token route discovery process. Please check back on
              this page within 20-40 minutes of submitting this form.
            </p>

            {isSubmitSuccess ? (
              <SuccessComponent />
            ) : isSubmitFail ? (
              <FailComponent />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="chainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blockchain</FormLabel>
                      <FormControl>
                        <NetworkSelectorButton
                          onSwitchChain={(chain) => {
                            // When a chain is selected, capture its ID and name
                            setSelectedChainId(chain.chainId);

                            // Update the form field value
                            field.onChange(chain.chainId);
                          }}
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
            )}
          </div>
        </RouteDiscoveryCard>
      </form>
    </Form>
  );
};
