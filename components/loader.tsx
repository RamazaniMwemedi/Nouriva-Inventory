import React from 'react';
import Image from 'next/image';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-grow flex items-center justify-center h-24 w-24">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={1000}
          height={1000}
          className="animate-pulse rounded-2xl"
        />
      </div>
    </div>
  );
};

export default Loader;
