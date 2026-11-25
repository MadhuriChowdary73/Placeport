import { LoginForm } from '@/components/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlacePort | Amrita Amaravati Campus Placement Portal',
  description: 'Placement interview experiences, preparation insights, and resources for Amrita Amaravati students.',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const initialError =
    params?.error === 'domain_not_allowed'
      ? 'Please sign in with your Amrita student email'
      : null

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6]">
      {/* Top Brand Stripe */}
      <div className="bg-[#A41D35] h-[4px] w-full" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-[940px] w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl shadow-xl border border-[#E8E2D9] overflow-hidden p-6 sm:p-12">
          
          {/* Left: Campus Art & Intro */}
          <div className="flex flex-col justify-between space-y-6 md:border-r md:border-[#E8E2D9] md:pr-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDF2F4] text-[#A41D35] text-[13px] font-bold tracking-wide border border-[#F5D0D7] uppercase">
                <span>🎓</span> Amrita Amaravati Placement Portal
              </div>
              <h1 className="text-[30px] font-bold text-gray-900 leading-[1.25] tracking-tight">
                Placement Insights by{' '}
                <span className="text-[#A41D35]">Amaravati</span> Students
              </h1>
              <p className="text-[16px] text-gray-600 leading-[1.7] font-normal">
                Access curated interview rounds, technical questions, preparation tips, and verified CTC packages across top recruiters for Amrita Amaravati campus.
              </p>
            </div>

            {/* Campus Sketch */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E8E2D9] shadow-inner bg-[#FBF9F5] p-2">
              <img
                src="/amrita-campus.jpg"
                alt="Amrita Vishwa Vidyapeetham Campus Architecture"
                className="w-full h-48 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-xl flex items-end p-3.5">
                <span className="text-[13px] text-white font-medium drop-shadow-md tracking-wide">
                  Amrita Vishwa Vidyapeetham • Amaravati Campus
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[13px] text-gray-500">
              <span className="font-semibold text-gray-700 tracking-tight">श्रद्धावान् लभते ज्ञानम्</span>
              <span className="font-medium text-gray-600">Amaravati Campus</span>
            </div>
          </div>

          {/* Right: Auth Form (Always clean, no pre-filled or cached defaults) */}
          <div className="flex items-center justify-center">
            <LoginForm initialError={initialError} />
          </div>

        </div>
      </div>

      <footer className="text-center py-5 text-[13px] text-gray-500 font-normal">
        © {new Date().getFullYear()} PlacePort • Amrita Vishwa Vidyapeetham, Amaravati Campus
      </footer>
    </div>
  )
}
