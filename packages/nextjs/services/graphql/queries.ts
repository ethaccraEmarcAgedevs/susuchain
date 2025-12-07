import { gql } from "@apollo/client";

// Platform-wide stats query
export const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    platformStats(id: "platform-stats") {
      id
      totalGroups
      activeGroups
      completedGroups
      totalMembers
      totalValueLocked
      totalContributions
      totalPayouts
      averageGroupSize
      averageContributionAmount
      updatedAt
    }
  }
`;

// Daily stats for charts
export const GET_DAILY_STATS = gql`
  query GetDailyStats($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String) {
    dailyStats(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      date
      timestamp
      groupsCreated
      membersJoined
      contributionsMade
      contributionVolume
      payoutsCompleted
      payoutVolume
      activeGroups
      totalValueLocked
    }
  }
`;

// Weekly stats for trends
export const GET_WEEKLY_STATS = gql`
  query GetWeeklyStats($first: Int!, $orderDirection: String) {
    weeklyStats(first: $first, orderBy: startTimestamp, orderDirection: $orderDirection) {
      id
      week
      startTimestamp
      endTimestamp
      groupsCreated
      membersJoined
      contributionsMade
      contributionVolume
      payoutsCompleted
      payoutVolume
      averageGroupSize
      memberRetention
    }
  }
`;

// Monthly stats for long-term trends
export const GET_MONTHLY_STATS = gql`
  query GetMonthlyStats($first: Int!) {
    monthlyStats(first: $first, orderBy: startTimestamp, orderDirection: desc) {
      id
      month
      startTimestamp
      endTimestamp
      groupsCreated
      membersJoined
      contributionsMade
      contributionVolume
      payoutsCompleted
      payoutVolume
      growthRate
    }
  }
`;

// Group analytics query
export const GET_GROUP_ANALYTICS = gql`
  query GetGroupAnalytics($groupId: ID!) {
    group(id: $groupId) {
      id
      name
      ensName
      basename
      creator
      contributionAmount
      contributionInterval
      maxMembers
      currentMembers
      currentRound
      isActive
      totalValueLocked
      totalContributions
      totalPayouts
      createdAt
      updatedAt
      members {
        id
        address
        ensName
        basename
        joinedAt
        isActive
        totalContributions
        totalPayoutsReceived
        contributionCount
        missedContributions
        reliabilityScore
      }
      roundHistory {
        id
        roundNumber
        beneficiary
        startTime
        endTime
        expectedContributions
        actualContributions
        totalAmount
        isCompleted
      }
      contributions {
        id
        member {
          address
          ensName
        }
        amount
        timestamp
        isOnTime
      }
      payouts {
        id
        beneficiary {
          address
          ensName
        }
        amount
        timestamp
      }
    }
  }
`;

// Member analytics query
export const GET_MEMBER_ANALYTICS = gql`
  query GetMemberAnalytics($memberAddress: String!) {
    members(where: { address: $memberAddress }) {
      id
      group {
        id
        name
        ensName
      }
      address
      ensName
      basename
      joinedAt
      isActive
      totalContributions
      totalPayoutsReceived
      contributionCount
      missedContributions
      reliabilityScore
      contributions {
        id
        amount
        timestamp
        isOnTime
        round {
          roundNumber
        }
      }
      payoutsReceived {
        id
        amount
        timestamp
        round {
          roundNumber
        }
      }
    }
  }
`;

// Top groups by TVL
export const GET_TOP_GROUPS = gql`
  query GetTopGroups($first: Int!) {
    groups(first: $first, orderBy: totalValueLocked, orderDirection: desc, where: { isActive: true }) {
      id
      name
      ensName
      basename
      creator
      contributionAmount
      maxMembers
      currentMembers
      currentRound
      totalValueLocked
      totalContributions
      createdAt
    }
  }
`;

// Active groups query
export const GET_ACTIVE_GROUPS = gql`
  query GetActiveGroups($first: Int!, $skip: Int!) {
    groups(first: $first, skip: $skip, where: { isActive: true }, orderBy: createdAt, orderDirection: desc) {
      id
      name
      ensName
      currentMembers
      maxMembers
      totalValueLocked
      currentRound
    }
  }
`;

// Group health metrics
export const GET_GROUP_HEALTH = gql`
  query GetGroupHealth($groupId: ID!) {
    group(id: $groupId) {
      id
      name
      currentRound
      roundHistory(orderBy: roundNumber, orderDirection: desc, first: 5) {
        roundNumber
        expectedContributions
        actualContributions
        isCompleted
      }
      members {
        reliabilityScore
        isActive
      }
    }
  }
`;
