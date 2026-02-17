import { Link } from 'react-router-dom';
import { ShoppingBag, Github, Twitter, Instagram, Heart } from 'lucide-react';
import { CATEGORIES } from '../../constants';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-400 border-t border-gray-800">
      {/* Main Footer */}
      <div className="section-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">UNIMART</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The premier student-only marketplace. Buy and sell textbooks, electronics, and more with
              verified fellow students on campus.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/?category=${cat.id}`}
                    className="text-sm hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/sell', label: 'Sell a Product' },
                { to: '/orders', label: 'My Orders' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/help', label: 'Help Center' },
                { to: '#', label: 'About Us' },
                { to: '/terms', label: 'Terms of Service' },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm mb-4">Get notified about new listings and campus deals.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="section-padding py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © 2026 UNIMART. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-500" /> for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
