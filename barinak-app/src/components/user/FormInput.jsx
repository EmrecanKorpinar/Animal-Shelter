// FormInput component
export default function FormInput(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base ${props.className || ''}`}
    />
  );
}
