
import React from 'react';

const ProblemSection = () => {
  return (
    <section className="py-16 bg-red-50 dark:bg-red-900/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">
          ⚠️ Pare de perder dinheiro com servidores fora do ar!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">💸 Prejuízo por Downtime</h4>
            <p className="text-gray-600 dark:text-gray-400">Cada minuto offline = vendas perdidas</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">😰 Stress Desnecessário</h4>
            <p className="text-gray-600 dark:text-gray-400">Descobrir problemas pelos clientes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">🔍 Falta de Visibilidade</h4>
            <p className="text-gray-600 dark:text-gray-400">Não saber o que está acontecendo</p>
          </div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-lg">
          <h4 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
            ✅ DeskTools resolve tudo isso!
          </h4>
          <p className="text-green-600 dark:text-green-300">
            Seja o primeiro a saber quando algo der errado e resolva antes que afete seus clientes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
