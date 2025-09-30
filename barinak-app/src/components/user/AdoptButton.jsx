// AdoptButton component
export default function AdoptButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded font-semibold shadow transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      Sahiplen
    </button>
  );
}
