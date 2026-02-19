"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingData } from "../onboarding-container"

const recentWorkSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  isOngoing: z.boolean(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional()
}).refine((data) => {
  // If ongoing, endDate is not required
  if (data.isOngoing) return true
  // If not ongoing and endDate is provided, it should be after startDate
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type RecentWorkFormValues = z.infer<typeof recentWorkSchema>
type RecentWorkItem = OnboardingData["recentWork"][0]

interface RecentWorkStepProps {
  data: OnboardingData
  updateDataAction: (data: Partial<OnboardingData>) => void
  onNextAction: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

export function RecentWorkStep({ data, updateDataAction, onNextAction }: RecentWorkStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const t = useTranslations("onboarding.steps.recentWork")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)

  const form = useForm<RecentWorkFormValues>({
    resolver: zodResolver(recentWorkSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      isOngoing: false,
      startDate: "",
      endDate: ""
    }
  })

  const isOngoing = form.watch("isOngoing")

  const onSubmit = (values: RecentWorkFormValues) => {
    const newWork: RecentWorkItem = {
      ...values,
      endDate: values.isOngoing ? undefined : values.endDate
    }

    const updatedWork = [...data.recentWork]

    if (editingIndex !== null) {
      updatedWork[editingIndex] = newWork
    } else {
      updatedWork.push(newWork)
    }

    updateDataAction({ recentWork: updatedWork })

    // Reset form and close dialog
    form.reset()
    setIsDialogOpen(false)
    setEditingIndex(null)
  }

  const handleEdit = (index: number) => {
    const work = data.recentWork[index]
    form.reset(work)
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  const handleDelete = (index: number) => {
    const updatedWork = data.recentWork.filter((_, i) => i !== index)
    updateDataAction({ recentWork: updatedWork })
  }

  const handleAddNew = () => {
    form.reset({
      title: "",
      description: "",
      link: "",
      isOngoing: false,
      startDate: "",
      endDate: ""
    })
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  const formatDateRange = (startDate: string, endDate?: string, isOngoing?: boolean) => {
    const start = format(new Date(startDate), "MMM yyyy")
    if (isOngoing) return `${start} - Present`
    if (!endDate) return start
    const end = format(new Date(endDate), "MMM yyyy")
    return start === end ? start : `${start} - ${end}`
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Recent Work List */}
      <div className="space-y-4">
        {data.recentWork.length > 0 ? (
          data.recentWork.map((work, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg leading-tight">{work.title}</CardTitle>
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateRange(work.startDate, work.endDate, work.isOngoing)}</span>
                      {work.isOngoing && (
                        <Badge variant="secondary" className="text-xs">
                          {t("ongoing")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-1 ml-4", isRTL && "mr-4 ml-0")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-3">{work.description}</p>
                {work.link && (
                  <a
                    href={work.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex items-center gap-1 text-sm text-primary hover:underline", isRTL && "flex-row-reverse")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("viewProject")}
                  </a>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8 border-dashed">
            <CardContent>
              <h3 className="font-medium mb-2">{t("noWorkTitle")}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t("noWorkDescription")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add New Work Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleAddNew} className={cn("w-full gap-2", isRTL && "flex-row-reverse")}>
            <Plus className="h-4 w-4" />
            {t("addWork")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? t("editWork") : t("addWork")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("workTitle")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("workTitlePlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("workDescription")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder={t("workDescriptionPlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("workLink")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://example.com" />
                    </FormControl>
                    <FormDescription>{t("workLinkHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOngoing"
                render={({ field }) => (
                  <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isRTL && "flex-row-reverse")}>
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("isOngoing")}</FormLabel>
                      <FormDescription>{t("isOngoingHint")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("startDate")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isOngoing && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("endDate")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className={cn("flex justify-end gap-2 pt-4", isRTL && "justify-start")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? t("updateWork") : t("addWork")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
