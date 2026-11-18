export default function ExperienceLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      <div className="h-5 w-28 bg-gray-200 rounded" />
      <div className="bg-white border border-[#E8E2D9] rounded-3xl p-8 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-3/4 bg-gray-200 rounded" />
        <div className="flex gap-4 pt-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="bg-white border border-[#E8E2D9] rounded-3xl p-8 space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>
    </div>
  )
}
