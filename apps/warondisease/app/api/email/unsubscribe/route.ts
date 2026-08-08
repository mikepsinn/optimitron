import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { ROUTES } from '@/lib/routes'

const logger = createLogger("email-unsubscribe")

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    // Decode the token (base64 encoded user ID)
    const userId = Buffer.from(token, "base64").toString("utf-8")

    // Update user's email preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        newsletterSubscribed: false,
      },
    })

    logger.info(`User ${userId} unsubscribed from weekly emails`)

    // Return a simple HTML page confirming unsubscription
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Decentralized Institutes of Health</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            border: 4px solid #000;
            padding: 40px;
            max-width: 500px;
            text-align: center;
          }
          h1 {
            font-size: 32px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0 0 20px 0;
          }
          p {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.6;
            margin: 0 0 30px 0;
          }
          .button {
            display: inline-block;
            background: #FF6B9D;
            border: 4px solid #000;
            color: #000;
            font-size: 18px;
            font-weight: 900;
            text-decoration: none;
            text-transform: uppercase;
            padding: 16px 32px;
            box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
            transition: all 0.2s;
          }
          .button:hover {
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
            transform: translate(4px, 4px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ UNSUBSCRIBED</h1>
          <p>You've been unsubscribed from weekly email updates.</p>
          <p>You can re-enable weekly emails anytime from your dashboard settings.</p>
          <a href="${ROUTES.dashboard}" class="button">Go to Dashboard</a>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    )
  } catch (error) {
    logger.error("Error in unsubscribe:", error)
    return NextResponse.json(
      {
        error: "Failed to unsubscribe",
      },
      { status: 500 }
    )
  }
}
