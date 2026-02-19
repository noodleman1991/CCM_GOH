"use client";

import { useState } from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { RecentWork } from "@/generated/prisma";

interface RecentWorkTimelineProps {
  recentWork: (RecentWork)[];
  isOwnProfile?: boolean;
  onAdd?: () => void;
  onEdit?: (work: RecentWork) => void;
  onDelete?: (work: RecentWork) => void;
}

interface TimelineItemProps {
  work: RecentWork;
  isOwnProfile?: boolean;
  onEdit?: (work: RecentWork) => void;
  onDelete?: (work: RecentWork) => void;
}

function TimelineItem({ work, isOwnProfile, onEdit, onDelete }: TimelineItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref);

  const formatDateRange = (startDate: Date, endDate?: Date | null, isOngoing?: boolean) => {
    const start = format(startDate, "MMM yyyy");
    if (isOngoing) return `${start} - Present`;
    if (!endDate) return start;
    const end = format(endDate, "MMM yyyy");
    return start === end ? start : `${start} - ${end}`;
  };

  return (
    <div ref={ref} className="relative border-l-2 border-muted pl-8 pb-8 last:pb-0">
      <motion.div
        className="absolute w-4 h-4 rounded-full top-6 left-[-0.5rem] border-4 border-background"
        initial={{
          backgroundColor: "hsl(var(--muted))",
          opacity: 0.3,
        }}
        animate={
          isInView && {
            backgroundColor: work.isOngoing ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            opacity: 1,
          }
        }
        transition={{
          duration: 0.6,
          ease: "easeInOut",
        }}
      />

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={
                  isInView && {
                    opacity: 1,
                    y: 0,
                  }
                }
                transition={{
                  duration: 0.6,
                  ease: [0.21, 0.45, 0.27, 0.9],
                }}
              >
                <CardTitle className="text-lg leading-tight">{work.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange(work.startDate, work.endDate, work.isOngoing)}</span>
                  {work.isOngoing && (
                    <Badge variant="secondary" className="text-xs">
                      Ongoing
                    </Badge>
                  )}
                </div>
              </motion.div>
            </div>

            {isOwnProfile && (
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(work)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(work)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={
              isInView && {
                opacity: 1,
                y: 0,
              }
            }
            transition={{
              duration: 0.6,
              ease: [0.21, 0.45, 0.27, 0.9],
              delay: 0.1,
            }}
          >
            <CardDescription className="text-sm leading-relaxed mb-3">
              {work.description}
            </CardDescription>

            {work.link && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <a
                  href={work.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Project
                </a>
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RecentWorkTimeline({
  recentWork,
  isOwnProfile = false,
  onAdd,
  onEdit,
  onDelete,
}: RecentWorkTimelineProps) {
  // Sort by start date, most recent first, with ongoing projects at the top
  const sortedWork = [...recentWork].sort((a, b) => {
    if (a.isOngoing && !b.isOngoing) return -1;
    if (!a.isOngoing && b.isOngoing) return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  if (recentWork.length === 0 && !isOwnProfile) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">No recent work to display</p>
        </CardContent>
      </Card>
    );
  }

  if (recentWork.length === 0 && isOwnProfile) {
    return (
      <Card className="text-center py-8">
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Share Your Recent Work</h3>
            <p className="text-muted-foreground text-sm">
              Add your recent projects and contributions to showcase your work in climate action.
            </p>
          </div>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Project
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">Recent Work</h3>
            <p className="text-muted-foreground text-sm">
              Projects and contributions you've been working on
            </p>
          </div>
          <Button onClick={onAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      )}

      <div className="space-y-0">
        {sortedWork.map((work) => (
          <TimelineItem
            key={work.id}
            work={work}
            isOwnProfile={isOwnProfile}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}