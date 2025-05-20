"use server";
import { getAuthToken } from "app/(app)/api/lib/getAuthToken";
import { NEXT_PUBLIC_THIRDWEB_BRIDGE_HOST } from "../../constants/public-envs";

const UB_BASE_URL = NEXT_PUBLIC_THIRDWEB_BRIDGE_HOST;

export type TokenMetadata = {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  chainId: number;
  iconUri?: string;
};

export async function addUniversalBridgeTokenRoute(props: {
  chainId?: number;
  tokenAddress?: string;
}) {
  const authToken = await getAuthToken();
  const url = new URL(`${UB_BASE_URL}/v1/tokens`);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    } as Record<string, string>,
    body: JSON.stringify({
      chainId: props.chainId,
      tokenAddress: props.tokenAddress,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  const json = await res.json();
  return json.data as Array<TokenMetadata>;
}
