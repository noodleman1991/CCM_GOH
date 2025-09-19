import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserX, ArrowLeft } from 'lucide-react'

export default async function NotFound() {
    const t = await getTranslations('errors')
    const tCommon = await getTranslations('common')

    return (
        <div className="container py-16 max-w-2xl mx-auto">
            <Card className="text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <UserX className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{t('notFound')}</CardTitle>
                    <CardDescription className="text-base">
                        The user profile you&apos;re looking for doesn&apos;t exist or may have been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild variant="default">
                            <Link href="/profiles">
                                Browse Profiles
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {tCommon('back')} to Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
