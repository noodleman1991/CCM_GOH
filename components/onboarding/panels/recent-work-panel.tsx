"use client"

import React, { useState } from "react"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { rtlLocales } from "@/i18n/routing"
import type { OnboardingFormData } from "@/lib/schemas/onboarding-schema"

interface RecentWorkPanelProps {
  form: any
  content?: any
  isSubmitting?: boolean
}

export function RecentWorkPanel({ form, content }: RecentWorkPanelProps) {
  const t = useTranslations("onboarding.steps.recentWork")
  const locale = useLocale()
  const isRTL = rtlLocales.includes(locale)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const { fields, append, update, remove } = useFieldArray({
    control: form.control,
    name: "recentWork"
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    isOngoing: false,
    startDate: "",
    endDate: ""
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link: "",
      isOngoing: false,
      startDate: "",
      endDate: ""
    })
    setEditingIndex(null)
  }

  const handleEdit = (index: number) => {
    const item = fields[index] as any
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || "",
      isOngoing: item.isOngoing,
      startDate: item.startDate,
      endDate: item.endDate || ""
    })
    setEditingIndex(index)
  }

  const handleSave = () => {
    if (!formData.title || !formData.description || !formData.startDate) {
      return
    }

    const workItem = {
      title: formData.title,
      description: formData.description,
      link: formData.link,
      isOngoing: formData.isOngoing,
      startDate: formData.startDate,
      endDate: formData.isOngoing ? undefined : formData.endDate
    }

    if (editingIndex !== null) {
      update(editingIndex, workItem)
    } else {
      append(workItem)
    }

    resetForm()
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM yyyy")
    } catch {
      return dateString
    }
  }

  const isFormValid = formData.title && formData.description && formData.startDate &&
    (formData.isOngoing || formData.endDate)

  return (
    <div className={cn(
      "space-y-5",
      isRTL && "text-right [&_input]:text-right [&_textarea]:text-right"
    )} dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {content?.recentWorkTitle || t("title")}
        </h2>
        <p className="text-lg text-muted-foreground">
          {content?.recentWorkDescription || t("description")}
        </p>
      </div>

      {/* Existing Work Items */}
      {fields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{content?.fieldLabels?.recentWork?.yourWork || t("yourWork")}</h3>
          {fields.map((item: any, index: number) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRTL && "flex-row-reverse")}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(item.startDate)} - {item.isOngoing ? t("ongoing") : formatDate(item.endDate || "")}
                      </span>
                      {item.isOngoing && (
                        <Badge variant="secondary">{t("ongoing")}</Badge>
                      )}
                    </div>
                  </div>
                  <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{item.description}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex items-center gap-1 text-primary hover:underline", isRTL && "flex-row-reverse")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("viewProject")}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex !== null ? (content?.fieldLabels?.recentWork?.editWork || t("editWork")) : (content?.fieldLabels?.recentWork?.addWork || t("addWork"))}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="work-title" className="text-sm font-medium flex items-center gap-1">
                {content?.fieldLabels?.recentWork?.workTitle || t("workTitle")}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="work-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={content?.fieldPlaceholders?.workTitle || t("workTitlePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="work-link" className="text-sm font-medium">{content?.fieldLabels?.recentWork?.projectLink || t("projectLink")}</label>
              <Input
                id="work-link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder={content?.fieldPlaceholders?.projectLink || "https://..."}
                type="url"
              />
            </div>
          </div>

          <div>
            <label htmlFor="work-description" className="text-sm font-medium flex items-center gap-1">
              {content?.fieldLabels?.recentWork?.description || t("description")}
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="work-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={content?.fieldPlaceholders?.description || t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="work-start-date" className="text-sm font-medium flex items-center gap-1">
                {content?.fieldLabels?.recentWork?.startDate || t("startDate")}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="work-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="work-end-date" className="text-sm font-medium">
                {content?.fieldLabels?.recentWork?.endDate || t("endDate")}
                {!formData.isOngoing && <span className="text-red-500 ms-1">*</span>}
              </label>
              <Input
                id="work-end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={formData.isOngoing}
              />
            </div>
          </div>

          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Checkbox
              id="ongoing"
              checked={formData.isOngoing}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                isOngoing: !!checked,
                endDate: checked ? "" : formData.endDate
              })}
            />
            <label htmlFor="ongoing" className="text-sm font-medium">
              {content?.fieldLabels?.recentWork?.ongoingProject || t("ongoingProject")}
            </label>
          </div>

          <div className={cn("flex gap-2 pt-4", isRTL && "flex-row-reverse")}>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid}
            >
              {editingIndex !== null ? (content?.fieldLabels?.recentWork?.updateWork || t("updateWork")) : (content?.fieldLabels?.recentWork?.addWork || t("addWork"))}
            </Button>
            {editingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                {content?.fieldLabels?.recentWork?.cancel || t("cancel")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{content?.fieldLabels?.recentWork?.noWorkAdded || t("noWorkAdded")}</p>
          <p className="text-sm">{content?.fieldLabels?.recentWork?.addWorkHint || t("addWorkHint")}</p>
        </div>
      )}
    </div>
  )
}