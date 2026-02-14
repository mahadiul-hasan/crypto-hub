import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 text-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Crypto Hub</h3>
            <p className="text-gray-600 text-sm mb-4">
              Bangladesh's premier cryptocurrency education platform. Learn,
              earn, and grow with crypto.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-5000 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-5000 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-5000 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-5000 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  href="/about"
                  className="hover:text-gray-5000 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/instructors"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Instructors
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  href="/contact"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-gray-5000 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-gray-5000 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-600 text-sm mb-4">
              Subscribe to get updates on new courses and special offers.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button className="px-4 py-2 bg-violet-600 rounded-r-lg hover:bg-violet-700 transition-colors cursor-pointer">
                <Mail className="h-5 w-5 text-white" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-600 text-sm">
          <p>
            © {currentYear} Crypto Hub. All rights reserved. Made with{" "}
            <Heart className="h-4 w-4 inline text-red-500" /> in Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}
