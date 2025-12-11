import { EAS, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { Address, encodePacked, keccak256 } from "viem";

// Base EAS contract addresses
export const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021" as Address;
export const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020" as Address;

// Schema definitions
export const SCHEMAS = {
  CONTRIBUTION: {
    schema: "address group,uint256 round,uint256 amount,bool isOnTime",
    description: "Attestation for timely contribution to a Susu group round",
  },
  VOUCH: {
    schema: "address vouchee,string reason",
    description: "Trust vouch from one community member to another",
  },
  GROUP_COMPLETION: {
    schema: "address group,uint256 totalRounds,uint256 timestamp",
    description: "Attestation for completing an entire Susu group cycle",
  },
  RELIABILITY: {
    schema: "uint256 score,uint256 timestamp",
    description: "Payment reliability score (0-100) based on contribution history",
  },
};

export interface AttestationData {
  uid: string;
  schema: string;
  recipient: Address;
  attester: Address;
  time: number;
  expirationTime: number;
  revocationTime: number;
  refUID: string;
  data: string;
  decodedData?: any;
}

export interface ContributionAttestation {
  group: Address;
  round: bigint;
  amount: bigint;
  isOnTime: boolean;
}

export interface VouchAttestation {
  vouchee: Address;
  reason: string;
}

export interface GroupCompletionAttestation {
  group: Address;
  totalRounds: bigint;
  timestamp: bigint;
}

export interface ReliabilityAttestation {
  score: bigint;
  timestamp: bigint;
}

/**
 * Initialize EAS SDK instance
 */
export function initializeEAS(provider: any): EAS {
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(provider);
  return eas;
}

/**
 * Initialize Schema Registry
 */
export function initializeSchemaRegistry(provider: any): SchemaRegistry {
  const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
  schemaRegistry.connect(provider);
  return schemaRegistry;
}

/**
 * Register all schemas on EAS (should be done once during deployment)
 */
export async function registerSchemas(schemaRegistry: SchemaRegistry) {
  const schemaUIDs: Record<string, string> = {};

  try {
    // Register Contribution Schema
    const contributionTx = await schemaRegistry.register({
      schema: SCHEMAS.CONTRIBUTION.schema,
      resolverAddress: "0x0000000000000000000000000000000000000000", // No resolver
      revocable: false,
    });
    const contributionReceipt = await contributionTx.wait();
    schemaUIDs.CONTRIBUTION = contributionReceipt || "";

    // Register Vouch Schema
    const vouchTx = await schemaRegistry.register({
      schema: SCHEMAS.VOUCH.schema,
      resolverAddress: "0x0000000000000000000000000000000000000000",
      revocable: false,
    });
    const vouchReceipt = await vouchTx.wait();
    schemaUIDs.VOUCH = vouchReceipt || "";

    // Register Group Completion Schema
    const completionTx = await schemaRegistry.register({
      schema: SCHEMAS.GROUP_COMPLETION.schema,
      resolverAddress: "0x0000000000000000000000000000000000000000",
      revocable: false,
    });
    const completionReceipt = await completionTx.wait();
    schemaUIDs.GROUP_COMPLETION = completionReceipt || "";

    // Register Reliability Schema
    const reliabilityTx = await schemaRegistry.register({
      schema: SCHEMAS.RELIABILITY.schema,
      resolverAddress: "0x0000000000000000000000000000000000000000",
      revocable: false,
    });
    const reliabilityReceipt = await reliabilityTx.wait();
    schemaUIDs.RELIABILITY = reliabilityReceipt || "";

    return schemaUIDs;
  } catch (error) {
    console.error("Error registering schemas:", error);
    throw error;
  }
}

/**
 * Get user's attestations from EAS
 */
export async function getUserAttestations(
  eas: EAS,
  userAddress: Address,
  schemaUID?: string,
): Promise<AttestationData[]> {
  try {
    // In production, query EAS GraphQL endpoint
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error("Error fetching attestations:", error);
    return [];
  }
}

/**
 * Decode contribution attestation data
 */
export function decodeContributionAttestation(data: string): ContributionAttestation {
  const encoder = new SchemaEncoder(SCHEMAS.CONTRIBUTION.schema);
  const decoded = encoder.decodeData(data);

  return {
    group: decoded[0].value.value as Address,
    round: BigInt(decoded[1].value.value as string),
    amount: BigInt(decoded[2].value.value as string),
    isOnTime: decoded[3].value.value as boolean,
  };
}

/**
 * Decode vouch attestation data
 */
export function decodeVouchAttestation(data: string): VouchAttestation {
  const encoder = new SchemaEncoder(SCHEMAS.VOUCH.schema);
  const decoded = encoder.decodeData(data);

  return {
    vouchee: decoded[0].value.value as Address,
    reason: decoded[1].value.value as string,
  };
}

/**
 * Decode group completion attestation data
 */
export function decodeGroupCompletionAttestation(data: string): GroupCompletionAttestation {
  const encoder = new SchemaEncoder(SCHEMAS.GROUP_COMPLETION.schema);
  const decoded = encoder.decodeData(data);

  return {
    group: decoded[0].value.value as Address,
    totalRounds: BigInt(decoded[1].value.value as string),
    timestamp: BigInt(decoded[2].value.value as string),
  };
}

/**
 * Decode reliability attestation data
 */
export function decodeReliabilityAttestation(data: string): ReliabilityAttestation {
  const encoder = new SchemaEncoder(SCHEMAS.RELIABILITY.schema);
  const decoded = encoder.decodeData(data);

  return {
    score: BigInt(decoded[0].value.value as string),
    timestamp: BigInt(decoded[1].value.value as string),
  };
}

/**
 * Get attestation count by type for a user
 */
export async function getAttestationCounts(eas: EAS, userAddress: Address) {
  const attestations = await getUserAttestations(eas, userAddress);

  return {
    total: attestations.length,
    contributions: 0, // Would filter by schema in production
    vouches: 0,
    groupCompletions: 0,
    reliability: 0,
  };
}
