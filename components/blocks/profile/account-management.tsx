"use client"

import { useState, useMemo } from "react"
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

// The confirmation token is deliberately a fixed, untranslated literal — the
// user must type exactly this in every locale; surrounding copy is localized
// and references it via interpolation.
const DELETE_TOKEN = "DELETE"

// Localized validation messages (resolved from t() inside the component so the
// Zod errors show in the user's language — the proven newsletter pattern).
interface SchemaMessages {
  emailInvalid: string
  currentPasswordRequired: string
  newPasswordMin: string
  confirmPasswordRequired: string
  passwordsMismatch: string
}

const makeEmailUpdateSchema = (m: SchemaMessages) => z.object({
  email: z.string().email(m.emailInvalid)
})

const makePasswordChangeSchema = (m: SchemaMessages) => z.object({
  currentPassword: z.string().min(1, m.currentPasswordRequired),
  newPassword: z.string().min(8, m.newPasswordMin),
  confirmPassword: z.string().min(1, m.confirmPasswordRequired)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: m.passwordsMismatch,
  path: ["confirmPassword"]
})

type EmailUpdateValues = z.infer<ReturnType<typeof makeEmailUpdateSchema>>
type PasswordChangeValues = z.infer<ReturnType<typeof makePasswordChangeSchema>>

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

  // Schemas built inside the component so validation messages localize
  // (newsletter/case-study Zod-closure pattern).
  const schemaMessages = useMemo<SchemaMessages>(() => ({
    emailInvalid: t('validation.emailInvalid'),
    currentPasswordRequired: t('validation.currentPasswordRequired'),
    newPasswordMin: t('validation.newPasswordMin'),
    confirmPasswordRequired: t('validation.confirmPasswordRequired'),
    passwordsMismatch: t('validation.passwordsMismatch'),
  }), [t])
  const emailUpdateSchema = useMemo(() => makeEmailUpdateSchema(schemaMessages), [schemaMessages])
  const passwordChangeSchema = useMemo(() => makePasswordChangeSchema(schemaMessages), [schemaMessages])

  const emailForm = useForm<EmailUpdateValues>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      email: accountInfo?.primaryEmailAddress?.emailAddress || ""
    }
  })


  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
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
        throw new Error(t('errors.loadFailed'))
      }

      const data = await response.json()
      setAccountInfo(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Update email
  const handleEmailUpdate = async (data: EmailUpdateValues) => {
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
        throw new Error(result.error || t('errors.updateEmailFailed'))
      }

      toast.success(result.message)
      await fetchAccountInfo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.updateEmailFailed'))
    } finally {
      setLoading(false)
    }
  }


  // Change password
  const handlePasswordChange = async (data: PasswordChangeValues) => {
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
        throw new Error(result.error || t('errors.changePasswordFailed'))
      }

      toast.success(result.message)
      passwordForm.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.changePasswordFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_TOKEN) {
      toast.error(t('delete.confirm.typeError', { token: DELETE_TOKEN }))
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
        throw new Error(result.error || t('errors.deleteFailed'))
      }

      toast.success(result.message)
      // The Clerk user no longer exists; hard-navigate home to clear all
      // client-side auth/session state.
      window.location.href = '/'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.deleteFailed'))
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
              <p><bdi>{accountInfo?.primaryEmailAddress?.emailAddress || t('email.none')}</bdi></p>
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
                  {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
                <AlertTriangle className="me-2 h-4 w-4" />
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
                  {t.rich('delete.confirm.typeInstruction', {
                    token: DELETE_TOKEN,
                    strong: (chunks) => <strong>{chunks}</strong>
                  })}
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={DELETE_TOKEN}
                  dir="ltr"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  {t('delete.confirm.cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== DELETE_TOKEN}
                >
                  {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
