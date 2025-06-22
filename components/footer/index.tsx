import React from 'react';

const Footer = () => {
  const githubUrl = "https://github.com/ayyzad/CyrusNT";
  const email = "azadneenan@gmail.com";

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 mt-auto py-6">
      <div className="container mx-auto px-4 md:px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          This project is open-source. Find the code on{' '}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-gray-900 dark:hover:text-gray-50"
          >
            GitHub
          </a>
          .
        </p>
        <p>
          Contact:{' '}
          <a
            href={`mailto:${email}`}
            className="font-medium underline hover:text-gray-900 dark:hover:text-gray-50"
          >
            {email}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
