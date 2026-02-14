export default function LoadingAdmin() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white border rounded-xl animate-pulse"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-white border rounded-xl animate-pulse"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-white border rounded-xl animate-pulse" />
        <div className="h-72 bg-white border rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
