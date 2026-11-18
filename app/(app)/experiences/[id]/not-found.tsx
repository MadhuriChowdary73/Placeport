import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ExperienceNotFound() {
  return (
    <div className="max-w-xl mx-auto my-16 text-center space-y-6 bg-white border border-[#E8E2D9] rounded-3xl p-8 sm:p-12 shadow-xs">
      <div className="text-6xl">🔍</div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Experience Not Found</h2>
        <p className="text-gray-600 text-base">
          The interview experience you are looking for does not exist or may have been removed.
        </p>
      </div>
      <div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 bg-[#A41D35] hover:bg-[#8A152A] text-white font-bold px-6 py-3 rounded-xl transition text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>
      </div>
    </div>
  )
}
