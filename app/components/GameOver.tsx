'use client';

interface GameOverProps {
  show: boolean;
}

export function GameOver({ show }: GameOverProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="rounded-lg bg-gray-800/90 px-12 py-8 text-center shadow-xl">
        <h1 className="text-4xl font-bold text-red-500">You died!</h1>
        <p className="mt-4 text-xl text-white">Game over!</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-red-600 px-6 py-2 text-lg font-semibold text-white transition-colors hover:bg-red-700"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
