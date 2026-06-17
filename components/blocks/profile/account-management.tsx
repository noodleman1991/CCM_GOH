"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Mail, Key, Trash2, AlertTriangle } from "lucide-react"

const EmailUpdateSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

interface AccountInfo {
  id: string
  primaryEmailAddress: { emailAddress: string; verification?: { status: string } } | null
  primaryPhoneNumber: { phoneNumber: string; verification?: { status: string } } | null
  emailAddresses: Array<{ id: string; emailAddress: string; verification?: { status: string } }>
  phoneNumbers: Array<{ id: string; phoneNumber: string; verification?: { status: string } }>
  hasPassword: boolean
  twoFactorEnabled: boolean
  createdAt: number
  updatedAt: number
}

interface AccountManagementProps {
  initialData?: AccountInfo
}

export default function AccountManagement({ initialData }: AccountManagementProps) {
  const t = useTranslations('profile.account')
  const [loading, setLoading] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(initialData || null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const emailForm = useForm<z.infer<typeof EmailUpdateSchema>>({
    resolver: zodResolver(EmailUpdateSchema),
    defaultValues: {
      email: accountInfo?.primaryEmailAddress?.emailAddress || ""
    }
  })


  const passwordForm = useForm<z.infer<typeof PasswordChangeSchema>>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  // Fetch account info if not provided
  const fetchAccountInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/account')
      
      if (!response.ok) {
        throw new Error('Failed to fetch account information')
      }
      
      const data = await response.json()
      setAccountInfo(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load account information')
    } finally {
      setLoading(false)
    }
  }

  // Update email
  const handleEmailUpdate = async (data: z.infer<typeof EmailUpdateSchema>) => {
    try {
      setLoading(true)
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_email',
          email: data.email
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update email')
      }

      toast.success(result.message)
      await fetchAccountInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update email')
    } finally {
      setLoading(false)
    }
  }


  // Change password
  const handlePasswordChange = async (data: z.infer<typeof PasswordChangeSchema>) => {
    try {
      setLoading(true)
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      toast.success(result.message)
      passwordForm.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_account'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      toast.success(result.message)
      // The Clerk user no longer exists; hard-navigate home to clear all
      // client-side auth/session state.
      window.location.href = '/'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
      setLoading(false)
    }
  }

  // Load account info on mount if not provided
  useState(() => {
    if (!accountInfo) {
      fetchAccountInfo()
    }
  })

  if (loading && !accountInfo) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Your account ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ccm-midnight">{t('groups.account')}</h2>
          <p className="text-sm text-muted-foreground">{t('groups.accountDescription')}</p>
        </div>

      {/* Email Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('email.title')}
          </CardTitle>
          <CardDescription>{t('email.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm">
              <strong>{t('email.current')}</strong>
              <p>{accountInfo?.primaryEmailAddress?.emailAddress || t('email.none')}</p>
            </div>
            
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email.new')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('email.update')}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t('password.title')}
          </CardTitle>
          <CardDescription>{t('password.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password.current')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password.new')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('password.confirm')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('password.change')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </section>

      {/* ── Danger zone ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t('groups.dangerZone')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('groups.dangerZoneDescription')}</p>
        </div>

      {/* Delete Account */}
      <Card className="border-destructive/60 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            {t('delete.title')}
          </CardTitle>
          <CardDescription>{t('delete.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t('delete.button')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('delete.confirm.title')}</DialogTitle>
                <DialogDescription>
                  {t('delete.confirm.description')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {t('delete.confirm.publishedNote')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('delete.confirm.type')} <strong>DELETE</strong>
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  {t('delete.confirm.cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== "DELETE"}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('delete.confirm.delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      </section>
    </div>
  )
}
