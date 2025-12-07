"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WeeklyStats } from "~~/hooks/scaffold-eth/usePlatformAnalytics";

interface MemberGrowthChartProps {
  weeklyStats: WeeklyStats[];
  className?: string;
}

export default function MemberGrowthChart({ weeklyStats, className = "" }: MemberGrowthChartProps) {
  const chartData = useMemo(() => {
    return weeklyStats
      .slice()
      .reverse()
      .map(stat => ({
        week: stat.week.replace("week-", "W"),
        groupsCreated: stat.groupsCreated,
        membersJoined: stat.membersJoined,
      }));
  }, [weeklyStats]);

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Growth</h3>
        <div className="text-center text-gray-500 py-12">No data available</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Member & Group Growth</h3>
        <p className="text-sm text-gray-500">Weekly new members and groups created</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
          />
          <Legend />
          <Bar dataKey="membersJoined" fill="#10b981" name="Members Joined" radius={[4, 4, 0, 0]} />
          <Bar dataKey="groupsCreated" fill="#3b82f6" name="Groups Created" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
