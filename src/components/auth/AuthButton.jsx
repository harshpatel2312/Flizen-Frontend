export default function AuthButton({ children, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`w-full bg-primary text-on-primary font-label-md text-label-md font-bold rounded-full py-3 px-4 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
