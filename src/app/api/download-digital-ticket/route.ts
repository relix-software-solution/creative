import { NextRequest, NextResponse } from "next/server";

const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
  "http://localhost:3000";

function sanitizeFileName(value: string) {
  const cleaned = value
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "digital-ticket.png";
}

function isAllowedTicketPath(pathname: string) {
  return pathname.startsWith("/uploads/digital-tickets/");
}

export async function GET(request: NextRequest) {
  const imagePath = request.nextUrl.searchParams.get("path");
  const requestedFileName =
    request.nextUrl.searchParams.get("filename") || "digital-ticket.png";

  if (!imagePath) {
    return NextResponse.json(
      {
        message: "Digital ticket path is required",
      },
      {
        status: 400,
      },
    );
  }

  let normalizedPath: string;

  try {
    /**
     * يدعم:
     * /uploads/digital-tickets/...
     * http://localhost:3000/uploads/digital-tickets/...
     * https://public-domain/uploads/digital-tickets/...
     *
     * نأخذ الـ pathname فقط، وبعدها نجلب الصورة من الباك الداخلي.
     */
    normalizedPath = new URL(imagePath, backendOrigin).pathname;
  } catch {
    return NextResponse.json(
      {
        message: "Invalid digital ticket path",
      },
      {
        status: 400,
      },
    );
  }

  if (!isAllowedTicketPath(normalizedPath)) {
    return NextResponse.json(
      {
        message: "This file path is not allowed",
      },
      {
        status: 403,
      },
    );
  }

  const upstreamUrl = new URL(normalizedPath, backendOrigin);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          message: "Digital ticket image was not found",
          upstreamStatus: upstreamResponse.status,
        },
        {
          status: upstreamResponse.status,
        },
      );
    }

    const contentType =
      upstreamResponse.headers.get("content-type") || "image/png";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        {
          message: "The requested file is not an image",
        },
        {
          status: 415,
        },
      );
    }

    const fileBuffer = await upstreamResponse.arrayBuffer();
    const fileName = sanitizeFileName(requestedFileName);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          fileName,
        )}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Digital ticket download failed:", error);

    return NextResponse.json(
      {
        message: "Failed to download the digital ticket",
      },
      {
        status: 502,
      },
    );
  }
}
