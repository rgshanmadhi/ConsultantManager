export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-4 mt-8">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Mental Health Tracker &copy; {new Date().getFullYear()} - Your personal journey to wellbeing</p>
        <p className="mt-1">Remember: This app is a tool, not a replacement for professional mental health support.</p>
      </div>
    </footer>
  );
}
