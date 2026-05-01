export default function AuthInput({ id, type = 'text', placeholder, ...props }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className="w-full bg-surface-container border border-[#2C2C2C] rounded-lg py-3 px-4 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant"
      {...props}
    />
  );
}
