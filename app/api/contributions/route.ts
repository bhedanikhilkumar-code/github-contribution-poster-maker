import { NextRequest, NextResponse } from "next/server";

interface GraphQLDay {
  contributionCount: number;
  contributionLevel: "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
  date: string;
  weekday: number;
}

interface GraphQLWeek {
  contributionDays: GraphQLDay[];
}

interface GraphQLResponse {
  data?: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: GraphQLWeek[];
        };
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}

const QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json(
      { error: "Server is missing GITHUB_TOKEN. Please add it to your environment." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `GitHub API request failed with status ${response.status}.` },
        { status: response.status }
      );
    }

    const result = (await response.json()) as GraphQLResponse;

    if (result.errors?.length) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 400 });
    }

    if (!result.data?.user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      totalContributions: result.data.user.contributionsCollection.contributionCalendar.totalContributions,
      weeks: result.data.user.contributionsCollection.contributionCalendar.weeks
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch GitHub contribution data right now." }, { status: 500 });
  }
}
