import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BahujanSphere. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="text-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
