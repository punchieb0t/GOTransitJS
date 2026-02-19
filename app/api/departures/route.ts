import { NextRequest, NextResponse } from "next/server";

const API_KEY = "30026843";
const API_BASE = "https://api.openmetrolinx.com/OpenDataAPI/api/V1";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stop = searchParams.get("stop") || "CL";

  try {
    const url = `${API_BASE}/Stop/NextService?key=${API_KEY}&stopCode=${stop}&limit=10`;
    const response = await fetch(url, { next: { revalidate: 30 } });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departures" },
      { status: 500 }
    );
  }
}
