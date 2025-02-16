'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 text-center">
        <h1 className="font-semibold text-2xl md:text-3xl text-red-600">
          Oops! Something went wrong.
        </h1>
        <p className="text-gray-700">
          It looks like there was an issue with our setup. Please contact
          support for assistance.
        </p>
        <p className="text-gray-700">You can reach</p>
        <p>We apologize for the inconvenience and appreciate your patience.</p>
      </div>
    </main>
  );
}
