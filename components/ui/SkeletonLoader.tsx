export function SkeletonLoader() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Input Email skeleton */}
            <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-12"></div>
                <div className="h-11 bg-gray-300 rounded-md"></div>
            </div>

            {/* Input Password skeleton */}
            <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-11 bg-gray-300 rounded-md"></div>
            </div>

            {/* Checkbox skeleton */}
            <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>

            {/* Button skeleton */}
            <div className="h-11 bg-gray-300 rounded-md"></div>

            {/* Footer text skeleton */}
            <div className="space-y-2 pt-2">
                <div className="h-3 bg-gray-300 rounded w-48"></div>
                <div className="h-3 bg-gray-300 rounded w-56"></div>
            </div>
        </div>
    );
}
