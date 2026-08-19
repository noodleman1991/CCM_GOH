import React from 'react'
import { StringInputProps, useCurrentUser, set } from 'sanity'
import { Stack, Text, Code, Card, TextInput } from '@sanity/ui'
import { WarningOutlineIcon, LockIcon } from '@sanity/icons'

// Admin users - should be configured as env var in production
const ADMIN_EMAILS = [
  'admin@example.com', // Replace with actual admin emails
  // Add more admin emails as needed
]

interface AdminOnlyKeyInputProps extends StringInputProps {
  schemaType: StringInputProps['schemaType'] & {
    title?: string
    description?: string
    options?: {
      adminEmails?: string[]
    }
  }
}

export function AdminOnlyKeyInput(props: AdminOnlyKeyInputProps) {
  const { value, onChange, schemaType } = props
  const currentUser = useCurrentUser()

  // Get admin emails from schema options or fallback to default
  const adminEmails = schemaType.options?.adminEmails || ADMIN_EMAILS

  // Check if current user is an admin
  const isAdmin = currentUser?.email && adminEmails.includes(currentUser.email)

  // Check if this is a new document (no existing value)
  const isNewDocument = !value

  if (!isAdmin && !isNewDocument) {
    return (
      <Card padding={3} tone="caution" border>
        <Stack space={3}>
          <Stack space={2}>
            <LockIcon />
            <Text weight="semibold">Admin Only Field</Text>
          </Stack>
          <Text size={1}>
            This field can only be modified by administrators. Current value:
          </Text>
          <Code size={1}>{value || '(no value)'}</Code>
          <Text size={1}>
            This key value must match the corresponding Prisma enum values.
            Changes require database migration and developer coordination.
          </Text>
        </Stack>
      </Card>
    )
  }

  if (!isAdmin && isNewDocument) {
    return (
      <Stack space={3}>
        <TextInput
          value={value || ''}
          onChange={(event) => onChange?.(set((event.target as HTMLInputElement).value))}
          placeholder="Enter key value (e.g., CLIMATE_RESEARCHER)"
        />
        <Card padding={3} tone="caution" border>
          <Stack space={3}>
            <Stack space={2}>
              <WarningOutlineIcon />
              <Text weight="semibold">Developer Coordination Required</Text>
            </Stack>
            <Text size={1}>
              New {schemaType.title?.toLowerCase() || 'items'} will be <strong>inactive</strong> until a developer runs the sync process.
            </Text>
            <Text size={1}>
              Next steps:
              <br />1. Save this {schemaType.title?.toLowerCase() || 'item'} with all translations
              <br />2. Notify your development team
              <br />3. Developer runs: <code>pnpm sanity:sync migrate-enums</code>
            </Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Admin user - show normal input with warning
  return (
    <Stack space={3}>
      <TextInput
        value={value || ''}
        onChange={(event) => onChange?.(set((event.target as HTMLInputElement).value))}
        placeholder="Enter key value (e.g., researcher, activist)"
      />
      <Card padding={2} tone="caution" border>
        <Stack space={2}>
          <Text size={1} weight="semibold">Admin Warning</Text>
          <Text size={1}>
            This key must match Prisma enum values exactly. Changing this value requires:
          </Text>
          <Text size={1}>
            1. Update Prisma schema enum<br/>
            2. Run database migration<br/>
            3. Update any existing database records<br/>
            4. Coordinate with development team
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

// Helper function to create the input component with admin emails configuration
export function createAdminOnlyKeyInput(adminEmails?: string[]) {
  function AdminOnlyKeyInputWithEmails(props: StringInputProps) {
    return (
      <AdminOnlyKeyInput
        {...props}
        schemaType={{
          ...props.schemaType,
          options: {
            ...props.schemaType.options,
            adminEmails
          }
        }}
      />
    )
  }
  return AdminOnlyKeyInputWithEmails
}