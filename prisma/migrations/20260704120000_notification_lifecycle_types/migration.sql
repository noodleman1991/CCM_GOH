-- Experience-plan X3: project-lifecycle notification types.
ALTER TYPE "NotificationType" ADD VALUE 'TASK_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'OUTPUT_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'THREAD_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBER_JOINED';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOWED_PUBLISH';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REMINDER';
