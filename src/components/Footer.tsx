
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              FlowServ
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Monitoramento de servidores em nuvem
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 FlowServ. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
