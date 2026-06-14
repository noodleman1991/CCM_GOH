import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { deleteUserData } from "@/lib/account-deletion"
import { z } from "zod"

const UpdateAccountSchema = z.object({
  action: z.enum(["update_email", "update_phone", "change_password", "delete_account"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional()
})

/**
 * Account management operations (email, phone, password, delete)
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, email, phone, currentPassword, newPassword } = UpdateAccountSchema.parse(body)

    const clerkClientInstance = await clerkClient()

    switch (action) {
      case "update_email":
        if (!email) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          )
        }
        
        // Update email in Clerk
        const emailAddresses = await clerkClientInstance.emailAddresses.createEmailAddress({
          userId,
          emailAddress: email
        })
        
        return NextResponse.json({
          success: true,
          message: "Email update initiated. Please verify the new email address.",
          emailId: emailAddresses.id
        })

      case "update_phone":
        if (!phone) {
          return NextResponse.json(
            { error: "Phone number is required" },
            { status: 400 }
          )
        }
        
        // Update phone in Clerk
        const phoneNumber = await clerkClientInstance.phoneNumbers.createPhoneNumber({
          userId,
          phoneNumber: phone
        })
        
        return NextResponse.json({
          success: true,
          message: "Phone number update initiated. Please verify the new phone number.",
          phoneId: phoneNumber.id
        })

      case "change_password":
        if (!newPassword) {
          return NextResponse.json(
            { error: "New password is required" },
            { status: 400 }
          )
        }
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to change password" },
            { status: 400 }
          )
        }

        // Verify current password before allowing change
        try {
          await clerkClientInstance.users.verifyPassword({
            userId,
            password: currentPassword,
          })
        } catch {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 403 }
          )
        }

        await clerkClientInstance.users.updateUser(userId, {
          password: newPassword
        })
        
        return NextResponse.json({
          success: true,
          message: "Password updated successfully"
        })

      case "delete_account": {
        // GDPR erasure performed synchronously so the user's data is gone before
        // we respond — not left to the eventually-consistent Clerk webhook.
        // Order matters: erase our data FIRST, then delete the Clerk auth user.
        // If our erasure throws, the Clerk user still exists and the user can
        // retry, rather than ending up with a deleted login and orphaned data.
        const erasure = await deleteUserData(userId)

        // Delete the Clerk auth user last. The user.deleted webhook is an
        // idempotent backstop (it no-ops if the Prisma row is already gone).
        await clerkClientInstance.users.deleteUser(userId)

        return NextResponse.json({
          success: true,
          message: "Account deleted",
          erasure,
          // Surfaced so the UI can tell the user to contact the team about
          // any published case studies, which are intentionally retained.
          publishedCaseStudiesRetained: erasure.publishedRetained,
        })
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Account operation failed:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: "Account operation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get account information
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const clerkClientInstance = await clerkClient()
    const user = await clerkClientInstance.users.getUser(userId)
    
    return NextResponse.json({
      id: user.id,
      primaryEmailAddress: user.primaryEmailAddress,
      primaryPhoneNumber: user.primaryPhoneNumber,
      emailAddresses: user.emailAddresses,
      phoneNumbers: user.phoneNumbers,
      hasPassword: user.passwordEnabled,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  } catch (error) {
    console.error("Failed to fetch account info:", error)
    return NextResponse.json(
      { error: "Failed to fetch account information" },
      { status: 500 }
    )
  }
}