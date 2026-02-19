"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Briefcase, Award, FolderOpen, Users, MessageCircle, ArrowUp } from "lucide-react"
import { useTranslations } from 'next-intl'

interface Section {
  id: string
  icon: React.ComponentType<any>
  label: string
  visible: boolean
}

interface ProfileNavigationProps {
  sections: {
    about: boolean
    work: boolean
    skills: boolean
    projects: boolean
    communities: boolean
    contact: boolean
  }
  className?: string
}

export function ProfileNavigation({ sections, className }: ProfileNavigationProps) {
  const t = useTranslations('profile')
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [showScrollTop, setShowScrollTop] = useState(false)

  const sectionList: Section[] = [
    { id: 'hero', icon: User, label: 'Overview', visible: true },
    { id: 'about', icon: User, label: t('basicInfo'), visible: sections.about },
    { id: 'work', icon: Briefcase, label: 'Experience', visible: sections.work },
    { id: 'skills', icon: Award, label: 'Skills', visible: sections.skills },
    { id: 'projects', icon: FolderOpen, label: 'Projects', visible: sections.projects },
    { id: 'communities', icon: Users, label: 'Communities', visible: sections.communities },
    { id: 'contact', icon: MessageCircle, label: 'Contact', visible: sections.contact },
  ].filter(section => section.visible)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      setShowScrollTop(scrolled > 300)

      // Update active section based on scroll position
      const sections = document.querySelectorAll('section[id]')
      let current = 'hero'

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionHeight = (section as HTMLElement).offsetHeight
        if (scrolled >= sectionTop - 200 && scrolled < sectionTop + sectionHeight - 200) {
          current = section.getAttribute('id') || 'hero'
        }
      })

      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const yOffset = -80 // Account for sticky header
      const yPosition = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: yPosition, behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 z-40",
        className
      )}>
        <Card className="w-48">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {sectionList.map((section) => {
                const Icon = section.icon
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    size="sm"
                    onClick={() => scrollToSection(section.id)}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.label}
                  </Button>
                )
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation Dots */}
      <div className="xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col space-y-2">
          {sectionList.map((section) => (
            <button
              key={section.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                activeSection === section.id
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              onClick={() => scrollToSection(section.id)}
              aria-label={`Go to ${section.label}`}
            />
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg"
          size="icon"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  )
}
