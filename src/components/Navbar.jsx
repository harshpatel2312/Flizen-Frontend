export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 h-20 w-full bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/50 font-body-md antialiased">
      <div className="flex items-center gap-container-margin">
        <span className="text-2xl font-bold tracking-tighter text-white">Flizen</span>
        <div className="hidden md:flex gap-gutter items-center ml-8">
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            My Trips
          </a>
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            Flight Status
          </a>
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            Help
          </a>
        </div>
      </div>
      <div className="flex items-center gap-gutter">
        <button className="text-white hover:text-white transition-colors duration-200 active:opacity-80 transition-opacity">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <img
          alt="Premium member profile"
          className="w-8 h-8 rounded-full border border-zinc-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEZxubHz_ocZxD76IKflxZIj8zRl0WFNj2UnMjtFOTO28YN-T2f1vaxE6rc97bKkE79pZVVy2EPU85p3K7ZstqIc8UYcpDpZRZjhZt9j_muxRqnBpSQSYv1yN7JzzIIoYcF6fTw5AMr0ik9h_EzIMEuSFP70SNNBzCxq8TKcuiYmcHRfL0iz8KMjJnlgsdRiIn8e-7J5dMZTNQZU1zw0cZCRP16DGZGab9Kn7SetwfMkJZkNYbwOyEg8MUmyq1KcicDRK3B-6jV_-_"
        />
      </div>
    </nav>
  );
}
