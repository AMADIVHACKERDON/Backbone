import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. Start with a standard initial response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Injected cookies directly into the local request instance
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // FIX: Re-initialize the response passing the updated request context explicitly
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // Write the cookies securely onto the outgoing client response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Fetch the user state safely
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Supabase proxy auth check failed:", error.message);
  }

  const url = request.nextUrl.clone();

  // 3. Secure Redirect logic using request.nextUrl.clone() (Safer than new URL())
  if (!user && request.nextUrl.pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === '/login') {
    console.log("User is already logged in, redirecting to /new");
    url.pathname = '/new';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/', '/login'],
};
