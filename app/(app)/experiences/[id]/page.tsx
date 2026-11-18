import { notFound } from 'next/navigation'
import { getExperienceById } from '@/lib/services/experienceService'
import { ExperienceDetail } from '@/components/experience/ExperienceDetail'
import type { Metadata } from 'next'

interface ExperiencePageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { id } = await params
  const experience = await getExperienceById(id)
  if (!experience) {
    return { title: 'Experience Not Found | PlacePort' }
  }
  return {
    title: `${experience.role} at ${experience.company_name} | PlacePort Amaravati`,
    description: `Interview experience for ${experience.role} at ${experience.company_name} by Amrita Amaravati student.`,
  }
}

export default async function ExperienceDetailPage({ params }: ExperiencePageProps) {
  const { id } = await params
  const experience = await getExperienceById(id)

  if (!experience) {
    notFound()
  }

  return <ExperienceDetail experience={experience} />
}
