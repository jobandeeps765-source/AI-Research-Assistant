export default function LoadingSpinner({ message = "Generating research report..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-sm text-gray-500 animate-pulse">{message}</p>
    </div>
  );
}
