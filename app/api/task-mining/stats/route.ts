import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { getTaskMiningStats, getTopApplications } from "@/server/task-mining-storage";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getTaskMiningStats(user.id);
    const topApps = await getTopApplications(user.id, 10);

    return NextResponse.json({ 
      stats,
      topApplications: topApps
    });
  } catch (error) {
    console.error("Error fetching task mining stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
